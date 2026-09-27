const crypto = require("crypto");
const Payment = require("../models/Payment");
const User = require("../models/User");
const catchAsync = require("../utils/catchAsync");
const ApiError = require("../utils/ApiError");
const { notify } = require("../utils/notify");
const { PLAN_DETAILS, applySubscriptionPlan } = require("./subscriptionController");

const PAYSTACK_BASE_URL = "https://api.paystack.co";

const getSecretKey = () => {
  const key = process.env.PAYSTACK_SECRET_KEY;
  if (!key) {
    throw new ApiError(500, "Payments are not configured on this server (missing PAYSTACK_SECRET_KEY)");
  }
  return key;
};

const getCallbackUrl = () => {
  if (process.env.PAYSTACK_CALLBACK_URL) return process.env.PAYSTACK_CALLBACK_URL;
  const clientUrl = (process.env.CLIENT_URL || "http://localhost:5173").split(",")[0].trim().replace(/\/$/, "");
  return `${clientUrl}/subscription/callback`;
};

// @desc    Start a Paystack checkout for a paid plan upgrade
// @route   POST /api/payments/initialize
// @access  Private (patient)
const initializePayment = catchAsync(async (req, res) => {
  const { plan } = req.body;
  const planDetails = PLAN_DETAILS.find((p) => p.id === plan);
  if (!planDetails || plan === "free") {
    throw new ApiError(400, "plan must be 'basic' or 'premium'");
  }

  const secretKey = getSecretKey();
  const reference = `telemed_${req.user._id}_${Date.now()}`;

  const paystackRes = await fetch(`${PAYSTACK_BASE_URL}/transaction/initialize`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secretKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: req.user.email,
      amount: Math.round(planDetails.price * 100), // kobo
      currency: "NGN",
      reference,
      callback_url: getCallbackUrl(),
      metadata: {
        patientId: req.user._id.toString(),
        plan,
      },
    }),
  });

  const data = await paystackRes.json();
  if (!paystackRes.ok || !data.status) {
    throw new ApiError(502, data.message || "Failed to start payment with Paystack");
  }

  await Payment.create({
    patient: req.user._id,
    plan,
    amount: planDetails.price,
    reference,
    status: "pending",
  });

  res.status(200).json({
    success: true,
    authorizationUrl: data.data.authorization_url,
    reference: data.data.reference,
  });
});

// @desc    Verify a Paystack transaction and, if successful, apply the plan upgrade
// @route   GET /api/payments/verify/:reference
// @access  Private (patient)
const verifyPayment = catchAsync(async (req, res) => {
  const { reference } = req.params;
  const secretKey = getSecretKey();

  const payment = await Payment.findOne({ reference, patient: req.user._id });
  if (!payment) throw new ApiError(404, "Payment record not found");

  // Already processed (e.g. the webhook beat the redirect to it) - just return current state.
  if (payment.status === "success") {
    const subscription = await applySubscriptionPlan(req.user._id, payment.plan);
    return res.status(200).json({ success: true, payment, subscription });
  }

  const paystackRes = await fetch(`${PAYSTACK_BASE_URL}/transaction/verify/${encodeURIComponent(reference)}`, {
    headers: { Authorization: `Bearer ${secretKey}` },
  });
  const data = await paystackRes.json();

  if (!paystackRes.ok || !data.status) {
    throw new ApiError(502, data.message || "Failed to verify payment with Paystack");
  }

  const tx = data.data;
  const expectedAmountKobo = Math.round(payment.amount * 100);

  if (tx.status === "success" && tx.amount >= expectedAmountKobo && tx.currency === "NGN") {
    payment.status = "success";
    payment.paidAt = new Date(tx.paid_at || Date.now());
    payment.gatewayResponse = tx.gateway_response;
    await payment.save();

    const subscription = await applySubscriptionPlan(payment.patient, payment.plan);

    notify({
      io: req.app.get("io"),
      user: req.user,
      title: "Payment Confirmed",
      message: `Your payment of ${payment.currency} ${payment.amount.toLocaleString()} for the ${payment.plan} plan was received.`,
      type: "subscription",
      relatedId: payment._id,
      email: {
        template: "sendSubscriptionPaymentConfirmation",
        data: { name: req.user.firstName, plan: payment.plan, amount: payment.amount, currency: payment.currency },
      },
    }).catch((err) => console.error("[verifyPayment] Notify failed:", err.message));

    return res.status(200).json({ success: true, payment, subscription });
  }

  payment.status = "failed";
  payment.gatewayResponse = tx.gateway_response;
  await payment.save();

  notify({
    io: req.app.get("io"),
    user: req.user,
    title: "Payment Unsuccessful",
    message: `Your payment of ${payment.currency} ${payment.amount.toLocaleString()} for the ${payment.plan} plan wasn't successful.`,
    type: "subscription",
    relatedId: payment._id,
    email: {
      template: "sendSubscriptionPaymentFailed",
      data: {
        name: req.user.firstName,
        plan: payment.plan,
        amount: payment.amount,
        currency: payment.currency,
        reason: tx.gateway_response,
      },
    },
  }).catch((err) => console.error("[verifyPayment] Notify failed:", err.message));

  throw new ApiError(400, `Payment was not successful (${tx.gateway_response || tx.status})`);
});

// @desc    Paystack webhook - authoritative confirmation, independent of whether
//          the user's browser makes it back to the callback URL
// @route   POST /api/payments/webhook
// @access  Public (verified via Paystack signature header)
const handleWebhook = catchAsync(async (req, res) => {
  const secretKey = getSecretKey();
  const signature = req.headers["x-paystack-signature"];
  const expectedSignature = crypto.createHmac("sha512", secretKey).update(req.rawBody || "").digest("hex");

  if (!signature || signature !== expectedSignature) {
    return res.status(401).json({ success: false, message: "Invalid signature" });
  }

  const event = req.body;
  if (event.event === "charge.success") {
    const tx = event.data;
    const payment = await Payment.findOne({ reference: tx.reference });
    if (payment && payment.status !== "success") {
      payment.status = "success";
      payment.paidAt = new Date(tx.paid_at || Date.now());
      payment.gatewayResponse = tx.gateway_response;
      await payment.save();
      await applySubscriptionPlan(payment.patient, payment.plan);

      // The webhook can beat the browser back to /verify, so send the
      // confirmation from here too. No duplicate email risk either way: this
      // block only runs while payment.status was still "pending", and
      // verifyPayment's own success branch is unreachable once this webhook
      // has already flipped it to "success" (it short-circuits at the top).
      const patient = await User.findById(payment.patient);
      if (patient) {
        notify({
          io: req.app.get("io"),
          user: patient,
          title: "Payment Confirmed",
          message: `Your payment of ${payment.currency} ${payment.amount.toLocaleString()} for the ${payment.plan} plan was received.`,
          type: "subscription",
          relatedId: payment._id,
          email: {
            template: "sendSubscriptionPaymentConfirmation",
            data: { name: patient.firstName, plan: payment.plan, amount: payment.amount, currency: payment.currency },
          },
        }).catch((err) => console.error("[handleWebhook] Notify failed:", err.message));
      }
    }
  }

  res.status(200).json({ received: true });
});

// @desc    List the logged-in patient's payment history
// @route   GET /api/payments
// @access  Private (patient)
const getMyPayments = catchAsync(async (req, res) => {
  const payments = await Payment.find({ patient: req.user._id }).sort({ createdAt: -1 });
  res.status(200).json({ success: true, payments });
});

module.exports = { initializePayment, verifyPayment, handleWebhook, getMyPayments };

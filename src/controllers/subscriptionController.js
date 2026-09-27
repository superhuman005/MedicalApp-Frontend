const Subscription = require("../models/Subscription");
const catchAsync = require("../utils/catchAsync");
const ApiError = require("../utils/ApiError");

const PLAN_DETAILS = [
  {
    id: "free",
    name: "Free Plan",
    price: 0,
    currency: "NGN",
    period: "forever",
    familyMembers: 1,
    features: ["2 chat consultations per month", "Basic medical records", "Email support", "For yourself only"],
  },
  {
    id: "basic",
    name: "Basic Plan",
    price: 7500,
    currency: "NGN",
    period: "per month",
    familyMembers: 2,
    features: [
      "Unlimited chat consultations",
      "5 video consultations per month",
      "Priority support",
      "Advanced medical records",
      "Prescription management",
      "Coverage for up to 2 family members",
    ],
  },
  {
    id: "premium",
    name: "Premium Plan",
    price: 15000,
    currency: "NGN",
    period: "per month",
    familyMembers: 4,
    features: [
      "Unlimited chat consultations",
      "Unlimited video consultations",
      "24/7 priority support",
      "Advanced medical records",
      "Prescription management",
      "Coverage for up to 4 family members",
    ],
  },
];

const VALID_PLANS = PLAN_DETAILS.map((p) => p.id);

// Shared upgrade/downgrade logic, reused by the direct "switch to free" route
// below and by paymentController after a Paystack payment is verified as
// successful. Not itself a route handler.
const applySubscriptionPlan = async (patientId, plan) => {
  let subscription = await Subscription.findOne({ patient: patientId });
  const now = new Date();
  const oneMonthFromNow = new Date(now);
  oneMonthFromNow.setMonth(oneMonthFromNow.getMonth() + 1);

  if (!subscription) {
    subscription = await Subscription.create({
      patient: patientId,
      plan,
      status: "active",
      startDate: now,
      endDate: plan === "free" ? undefined : oneMonthFromNow,
      currentPeriodStart: now,
      autoRenew: plan !== "free",
    });
  } else {
    subscription.plan = plan;
    subscription.status = "active";
    subscription.startDate = now;
    subscription.endDate = plan === "free" ? undefined : oneMonthFromNow;
    subscription.currentPeriodStart = now;
    subscription.autoRenew = plan !== "free";
    subscription.videoConsultationsUsed = 0;
    subscription.chatConsultationsUsed = 0;
    await subscription.save();
  }

  return subscription;
};

// @desc    List available plans
// @route   GET /api/subscriptions/plans
// @access  Public
const getPlans = catchAsync(async (req, res) => {
  res.status(200).json({ success: true, plans: PLAN_DETAILS });
});

// @desc    Get the logged-in patient's current subscription
// @route   GET /api/subscriptions/current
// @access  Private (patient)
const getCurrentSubscription = catchAsync(async (req, res) => {
  let subscription = await Subscription.findOne({ patient: req.user._id });
  if (!subscription) {
    subscription = await Subscription.create({ patient: req.user._id, plan: "free" });
  }
  const limits = subscription.getLimits();
  res.status(200).json({ success: true, subscription, limits });
});

// @desc    Switch to the free plan (paid plans must go through
//          /api/payments/initialize + Paystack, not this endpoint)
// @route   POST /api/subscriptions/subscribe
// @access  Private (patient)
const subscribe = catchAsync(async (req, res) => {
  const { plan } = req.body;
  if (!VALID_PLANS.includes(plan)) {
    throw new ApiError(400, `plan must be one of: ${VALID_PLANS.join(", ")}`);
  }
  if (plan !== "free") {
    throw new ApiError(
      400,
      "Paid plans require payment. Start checkout at POST /api/payments/initialize instead."
    );
  }

  const subscription = await applySubscriptionPlan(req.user._id, plan);

  res.status(200).json({ success: true, message: "Switched to the free plan", subscription });
});

// @desc    Cancel the current subscription (stops auto-renew)
// @route   POST /api/subscriptions/cancel
// @access  Private (patient)
const cancelSubscription = catchAsync(async (req, res) => {
  const subscription = await Subscription.findOne({ patient: req.user._id });
  if (!subscription) throw new ApiError(404, "No active subscription found");

  subscription.autoRenew = false;
  subscription.status = "cancelled";
  await subscription.save();

  res.status(200).json({ success: true, message: "Subscription cancelled", subscription });
});

module.exports = {
  getPlans,
  getCurrentSubscription,
  subscribe,
  cancelSubscription,
  applySubscriptionPlan,
  PLAN_DETAILS,
};

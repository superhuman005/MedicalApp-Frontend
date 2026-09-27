const paystackService = require('../services/paystackService');
const { Payment, Appointment, Subscription, User, Doctor } = require('../models');
const { asyncHandler } = require('../routes/middleware/validate');
const emailService = require('../services/emailService');
exports.initializePayment = asyncHandler(async (req, res) => {
    const { appointmentId, subscriptionId, amount, currency } = req.body;
    if (!appointmentId && !subscriptionId) {
        return res.status(400).json({
            success: false,
            message: 'Please provide appointment ID or subscription ID'
        });
    }
    let paymentAmount = amount;
    let currencyCode = currency || 'NGN';
    let metadata = {};
    if (appointmentId) {
        const appointment = await Appointment.findById(appointmentId)
            .populate('patient');
        if (!appointment) {
            return res.status(404).json({
                success: false,
                message: 'Appointment not found'
            });
        }
        paymentAmount = appointment.fee.amount;
        currencyCode = appointment.fee.currency;
        metadata = {
            type: 'appointment',
            appointmentId,
            patientId: appointment.patient._id.toString()
        };
    }
    if (subscriptionId) {
        const subscription = await Subscription.findById(subscriptionId);
        if (!subscription) {
            return res.status(404).json({
                success: false,
                message: 'Subscription not found'
            });
        }
        paymentAmount = subscription.price.amount;
        currencyCode = subscription.price.currency;
        metadata = {
            type: 'subscription',
            subscriptionId,
            plan: subscription.plan
        };
    }
    const reference = paystackService.generateReference();
    const payment = await Payment.create({
        user: req.user.id,
        appointment: appointmentId || null,
        subscription: subscriptionId || null,
        amount: paymentAmount,
        currency: currencyCode,
        status: 'initiated',
        paystack: {
            reference
        },
        metadata
    });
    const callbackUrl = `${process.env.FRONTEND_URL}/payment/callback`;
    const result = await paystackService.initializeTransaction({
        amount: paymentAmount,
        email: req.user.email,
        reference,
        callbackUrl,
        metadata
    });
    if (!result.success) {
        payment.status = 'failed';
        payment.failureReason = result.error;
        await payment.save();
        return res.status(400).json({
            success: false,
            message: result.error
        });
    }
    payment.paystack.accessCode = result.data.access_code;
    payment.paystack.authorizationUrl = result.data.authorization_url;
    payment.status = 'processing';
    await payment.save();
    res.status(200).json({
        success: true,
        data: {
            paymentId: payment._id,
            reference,
            authorizationUrl: result.data.authorization_url,
            accessCode: result.data.access_code
        }
    });
});
exports.verifyPayment = asyncHandler(async (req, res) => {
    const { reference } = req.params;
    const payment = await Payment.findOne({ 'paystack.reference': reference });
    if (!payment) {
        return res.status(404).json({
            success: false,
            message: 'Payment not found'
        });
    }
    if (payment.user.toString() !== req.user.id) {
        return res.status(403).json({
            success: false,
            message: 'Not authorized to verify this payment'
        });
    }
    const result = await paystackService.verifyTransaction(reference);
    if (!result.success) {
        return res.status(400).json({
            success: false,
            message: result.error
        });
    }
    const transactionData = result.data;
    payment.callbackReceived = true;
    payment.callbackData = transactionData;
    if (transactionData.status === 'success') {
        payment.status = 'success';
        payment.paidAt = new Date(transactionData.paid_at || Date.now());
        payment.paystack.transactionId = transactionData.id;
        payment.paystack.channel = transactionData.channel;
        if (transactionData.authorization) {
            payment.paystack.authorizationCode = transactionData.authorization.authorization_code;
            payment.paystack.cardType = transactionData.authorization.card_type;
            payment.paystack.bank = transactionData.authorization.bank;
            payment.paystack.last4 = transactionData.authorization.last4;
        }
        if (transactionData.fees) {
            payment.fees.amount = transactionData.fees / 100;
        }
        await payment.save();
        if (payment.appointment) {
            const appointment = await Appointment.findById(payment.appointment);
            if (appointment) {
                appointment.fee.isPaid = true;
                appointment.fee.paidAt = new Date();
                await appointment.save();
                const doctor = await Doctor.findById(appointment.doctor).populate('user');
                await emailService.sendPaymentConfirmation(req.user.email, {
                    patientName: `${req.user.firstName} ${req.user.lastName}`,
                    doctorName: `${doctor.user.firstName} ${doctor.user.lastName}`,
                    amount: payment.amount,
                    currency: payment.currency,
                    date: appointment.date,
                    time: appointment.startTime
                });
            }
        }
        if (payment.subscription) {
            const subscription = await Subscription.findById(payment.subscription);
            if (subscription) {
                subscription.status = 'active';
                subscription.history.push({
                    action: 'renewed',
                    date: new Date()
                });
                await subscription.save();
            }
        }
    }
    else {
        payment.status = 'failed';
        payment.failureReason = transactionData.status;
        await payment.save();
    }
    res.status(200).json({
        success: true,
        data: {
            payment,
            transaction: transactionData
        }
    });
});
exports.handleWebhook = asyncHandler(async (req, res) => {
    const signature = req.headers['x-paystack-signature'];
    if (!paystackService.verifyWebhookSignature(req.body, signature)) {
        return res.status(400).json({
            success: false,
            message: 'Invalid signature'
        });
    }
    const event = req.body;
    if (event.event === 'charge.success') {
        const { reference, status } = event.data;
        const payment = await Payment.findOne({ 'paystack.reference': reference })
            .populate('user');
        if (payment && payment.status !== 'success') {
            payment.status = 'success';
            payment.paidAt = new Date();
            payment.callbackData = event.data;
            payment.callbackReceived = true;
            if (event.data.authorization) {
                payment.paystack.authorizationCode = event.data.authorization.authorization_code;
                payment.paystack.cardType = event.data.authorization.card_type;
                payment.paystack.bank = event.data.authorization.bank;
                payment.paystack.last4 = event.data.authorization.last4;
            }
            await payment.save();
            if (payment.appointment) {
                const appointment = await Appointment.findById(payment.appointment);
                if (appointment) {
                    appointment.fee.isPaid = true;
                    appointment.fee.paidAt = new Date();
                    await appointment.save();
                }
            }
        }
    }
    if (event.event === 'charge.failed') {
        const { reference } = event.data;
        const payment = await Payment.findOne({ 'paystack.reference': reference });
        if (payment) {
            payment.status = 'failed';
            payment.failureReason = event.data.status;
            payment.callbackData = event.data;
            await payment.save();
        }
    }
    res.status(200).json({ status: 'success' });
});
exports.getPaymentHistory = asyncHandler(async (req, res) => {
    const payments = await Payment.find({ user: req.user.id })
        .populate({
        path: 'appointment',
        populate: {
            path: 'doctor',
            populate: { path: 'user', select: 'firstName lastName' }
        }
    })
        .populate('subscription')
        .sort({ createdAt: -1 });
    res.status(200).json({
        success: true,
        count: payments.length,
        data: payments
    });
});
exports.getPayment = asyncHandler(async (req, res) => {
    const payment = await Payment.findById(req.params.id)
        .populate({
        path: 'appointment',
        populate: {
            path: 'doctor',
            populate: { path: 'user', select: 'firstName lastName' }
        }
    })
        .populate('subscription');
    if (!payment) {
        return res.status(404).json({
            success: false,
            message: 'Payment not found'
        });
    }
    if (payment.user.toString() !== req.user.id && req.user.role !== 'admin') {
        return res.status(403).json({
            success: false,
            message: 'Not authorized to access this payment'
        });
    }
    res.status(200).json({
        success: true,
        data: payment
    });
});
exports.refundPayment = asyncHandler(async (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({
            success: false,
            message: 'Only admins can process refunds'
        });
    }
    const payment = await Payment.findById(req.params.id).populate('appointment');
    if (!payment) {
        return res.status(404).json({
            success: false,
            message: 'Payment not found'
        });
    }
    if (payment.status !== 'success') {
        return res.status(400).json({
            success: false,
            message: 'Can only refund successful payments'
        });
    }
    if (payment.refundedAt) {
        return res.status(400).json({
            success: false,
            message: 'Payment already refunded'
        });
    }
    payment.status = 'refunded';
    payment.refundedAt = new Date();
    payment.refundAmount = payment.amount;
    await payment.save();
    if (payment.appointment) {
        const appointment = payment.appointment;
        appointment.fee.isPaid = false;
        appointment.fee.paidAt = null;
        await appointment.save();
    }
    const user = await User.findById(payment.user);
    await emailService.sendRefundNotification(user.email, {
        amount: payment.amount,
        currency: payment.currency,
        refundedAt: payment.refundedAt
    });
    res.status(200).json({
        success: true,
        message: 'Payment refunded successfully',
        data: payment
    });
});
//# sourceMappingURL=paymentController.js.map
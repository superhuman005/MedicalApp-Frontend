const { Subscription, Payment } = require('../models');
const { asyncHandler } = require('../routes/middleware/validate');
const paystackService = require('../services/paystackService');
const emailService = require('../services/emailService');
const PLAN_CONFIGS = {
    basic: {
        name: 'Basic Plan',
        code: 'BASIC_MONTHLY',
        amount: 5000,
        interval: 'monthly',
        features: {
            maxConsultations: 3,
            videoConsultations: false,
            priorityBooking: false,
            familyAccounts: 0,
            discountPercentage: 0
        }
    },
    standard: {
        name: 'Standard Plan',
        code: 'STANDARD_MONTHLY',
        amount: 15000,
        interval: 'monthly',
        features: {
            maxConsultations: 10,
            videoConsultations: true,
            priorityBooking: false,
            familyAccounts: 1,
            discountPercentage: 10
        }
    },
    premium: {
        name: 'Premium Plan',
        code: 'PREMIUM_MONTHLY',
        amount: 30000,
        interval: 'monthly',
        features: {
            maxConsultations: -1,
            videoConsultations: true,
            priorityBooking: true,
            familyAccounts: 3,
            discountPercentage: 20
        }
    },
    family: {
        name: 'Family Plan',
        code: 'FAMILY_MONTHLY',
        amount: 50000,
        interval: 'monthly',
        features: {
            maxConsultations: -1,
            videoConsultations: true,
            priorityBooking: true,
            familyAccounts: 10,
            discountPercentage: 25
        }
    }
};
const BILLING_CYCLES = {
    monthly: 1,
    quarterly: 3,
    yearly: 12
};
exports.getPlans = asyncHandler(async (req, res) => {
    const plans = Object.entries(PLAN_CONFIGS).map(([key, config]) => ({
        plan: key,
        ...config
    }));
    res.status(200).json({
        success: true,
        data: plans
    });
});
exports.getCurrentSubscription = asyncHandler(async (req, res) => {
    const subscription = await Subscription.findOne({
        user: req.user.id,
        status: { $in: ['active', 'pending'] }
    });
    if (!subscription) {
        return res.status(200).json({
            success: true,
            data: null,
            message: 'No active subscription found'
        });
    }
    res.status(200).json({
        success: true,
        data: subscription
    });
});
exports.createSubscription = asyncHandler(async (req, res) => {
    const { plan, billingCycle = 'monthly' } = req.body;
    if (!PLAN_CONFIGS[plan]) {
        return res.status(400).json({
            success: false,
            message: 'Invalid subscription plan'
        });
    }
    const existingSubscription = await Subscription.findOne({
        user: req.user.id,
        status: { $in: ['active', 'pending'] }
    });
    if (existingSubscription) {
        return res.status(400).json({
            success: false,
            message: 'User already has an active subscription'
        });
    }
    const planConfig = PLAN_CONFIGS[plan];
    const months = BILLING_CYCLES[billingCycle] || 1;
    const totalAmount = planConfig.amount * months;
    const startDate = new Date();
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + months);
    const subscription = await Subscription.create({
        user: req.user.id,
        plan,
        status: 'pending',
        startDate,
        endDate,
        billingCycle,
        price: {
            amount: totalAmount,
            currency: 'NGN'
        },
        features: planConfig.features,
        history: [{
                action: 'created',
                date: startDate,
                details: `Created ${plan} subscription with ${billingCycle} billing`
            }]
    });
    const reference = paystackService.generateReference();
    const payment = await Payment.create({
        user: req.user.id,
        subscription: subscription._id,
        amount: totalAmount,
        currency: 'NGN',
        status: 'pending',
        paystack: {
            reference
        },
        metadata: {
            type: 'subscription',
            subscriptionId: subscription._id,
            plan
        }
    });
    const callbackUrl = `${process.env.FRONTEND_URL}/subscription/callback`;
    const result = await paystackService.initializeTransaction({
        amount: totalAmount,
        email: req.user.email,
        reference,
        callbackUrl,
        metadata: {
            subscriptionId: subscription._id.toString(),
            plan,
            billingCycle
        }
    });
    if (!result.success) {
        subscription.status = 'expired';
        await subscription.save();
        return res.status(400).json({
            success: false,
            message: result.error
        });
    }
    payment.paystack.authorizationUrl = result.data.authorization_url;
    payment.paystack.accessCode = result.data.access_code;
    payment.status = 'processing';
    await payment.save();
    res.status(200).json({
        success: true,
        data: {
            subscription,
            payment: {
                reference,
                authorizationUrl: result.data.authorization_url
            }
        }
    });
});
exports.upgradeSubscription = asyncHandler(async (req, res) => {
    const { plan } = req.body;
    if (!PLAN_CONFIGS[plan]) {
        return res.status(400).json({
            success: false,
            message: 'Invalid subscription plan'
        });
    }
    const currentSubscription = await Subscription.findOne({
        user: req.user.id,
        status: 'active'
    });
    if (!currentSubscription) {
        return res.status(404).json({
            success: false,
            message: 'No active subscription to upgrade'
        });
    }
    const planConfig = PLAN_CONFIGS[plan];
    if (planConfig.amount <= PLAN_CONFIGS[currentSubscription.plan].amount) {
        return res.status(400).json({
            success: false,
            message: 'New plan must have higher value than current plan'
        });
    }
    const oldPlan = currentSubscription.plan;
    currentSubscription.plan = plan;
    currentSubscription.features = planConfig.features;
    currentSubscription.price.amount = planConfig.amount;
    currentSubscription.history.push({
        action: 'upgraded',
        date: new Date(),
        details: `Upgraded from ${oldPlan} to ${plan}`
    });
    await currentSubscription.save();
    res.status(200).json({
        success: true,
        data: currentSubscription,
        message: 'Subscription upgraded successfully'
    });
});
exports.cancelSubscription = asyncHandler(async (req, res) => {
    const { reason } = req.body;
    const subscription = await Subscription.findOne({
        user: req.user.id,
        status: 'active'
    });
    if (!subscription) {
        return res.status(404).json({
            success: false,
            message: 'No active subscription found'
        });
    }
    subscription.status = 'cancelled';
    subscription.cancelledAt = new Date();
    subscription.cancellationReason = reason;
    subscription.autoRenew = false;
    subscription.history.push({
        action: 'cancelled',
        date: new Date(),
        details: reason
    });
    if (subscription.paystack.subscriptionCode) {
        await paystackService.cancelSubscription(subscription.paystack.subscriptionCode);
    }
    await subscription.save();
    res.status(200).json({
        success: true,
        message: 'Subscription cancelled successfully',
        data: subscription
    });
});
exports.reactivateSubscription = asyncHandler(async (req, res) => {
    const subscription = await Subscription.findOne({
        user: req.user.id,
        status: 'cancelled'
    }).sort({ createdAt: -1 });
    if (!subscription) {
        return res.status(404).json({
            success: false,
            message: 'No cancelled subscription found'
        });
    }
    if (subscription.endDate < new Date()) {
        return res.status(400).json({
            success: false,
            message: 'Subscription has already expired'
        });
    }
    subscription.status = 'active';
    subscription.cancelledAt = null;
    subscription.cancellationReason = null;
    subscription.autoRenew = true;
    subscription.history.push({
        action: 'resumed',
        date: new Date(),
        details: 'Subscription reactivated'
    });
    await subscription.save();
    res.status(200).json({
        success: true,
        data: subscription
    });
});
exports.getSubscriptionHistory = asyncHandler(async (req, res) => {
    const subscriptions = await Subscription.find({ user: req.user.id })
        .sort({ createdAt: -1 });
    res.status(200).json({
        success: true,
        count: subscriptions.length,
        data: subscriptions
    });
});
exports.getAllSubscriptions = asyncHandler(async (req, res) => {
    const { status, page = 1, limit = 10 } = req.query;
    let query = {};
    if (status)
        query.status = status;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const subscriptions = await Subscription.find(query)
        .populate('user', 'firstName lastName email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit));
    const total = await Subscription.countDocuments(query);
    res.status(200).json({
        success: true,
        count: subscriptions.length,
        total,
        data: subscriptions
    });
});
//# sourceMappingURL=subscriptionController.js.map
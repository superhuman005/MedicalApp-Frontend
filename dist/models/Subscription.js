const mongoose = require('mongoose');
const subscriptionSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    plan: {
        type: String,
        enum: ['basic', 'standard', 'premium', 'family'],
        required: [true, 'Subscription plan is required']
    },
    status: {
        type: String,
        enum: ['active', 'cancelled', 'expired', 'paused', 'pending'],
        default: 'pending'
    },
    startDate: {
        type: Date,
        required: true
    },
    endDate: {
        type: Date,
        required: true
    },
    billingCycle: {
        type: String,
        enum: ['monthly', 'quarterly', 'yearly'],
        default: 'monthly'
    },
    price: {
        amount: {
            type: Number,
            required: [true, 'Price amount is required']
        },
        currency: {
            type: String,
            default: 'NGN'
        }
    },
    features: {
        maxConsultations: {
            type: Number,
            default: 3
        },
        videoConsultations: {
            type: Boolean,
            default: false
        },
        priorityBooking: {
            type: Boolean,
            default: false
        },
        familyAccounts: {
            type: Number,
            default: 0
        },
        discountPercentage: {
            type: Number,
            default: 0
        }
    },
    usage: {
        consultationsUsed: {
            type: Number,
            default: 0
        },
        videoConsultationsUsed: {
            type: Number,
            default: 0
        }
    },
    paystack: {
        subscriptionCode: String,
        emailToken: String,
        planCode: String
    },
    cancelledAt: {
        type: Date,
        default: null
    },
    cancellationReason: {
        type: String
    },
    autoRenew: {
        type: Boolean,
        default: true
    },
    history: [{
            action: {
                type: String,
                enum: ['created', 'renewed', 'upgraded', 'downgraded', 'cancelled', 'paused', 'resumed']
            },
            date: Date,
            details: String
        }]
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});
subscriptionSchema.virtual('payments', {
    ref: 'Payment',
    localField: '_id',
    foreignField: 'subscription'
});
subscriptionSchema.index({ user: 1 });
subscriptionSchema.index({ status: 1 });
subscriptionSchema.index({ endDate: 1 });
subscriptionSchema.methods.isExpired = function () {
    return new Date() > this.endDate;
};
subscriptionSchema.methods.daysRemaining = function () {
    const diff = this.endDate - new Date();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
};
subscriptionSchema.methods.canUseConsultation = function () {
    if (this.status !== 'active')
        return false;
    return this.usage.consultationsUsed < this.features.maxConsultations;
};
module.exports = mongoose.model('Subscription', subscriptionSchema);
//# sourceMappingURL=Subscription.js.map
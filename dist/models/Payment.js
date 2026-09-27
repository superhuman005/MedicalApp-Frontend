const mongoose = require('mongoose');
const paymentSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    appointment: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Appointment'
    },
    subscription: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Subscription'
    },
    amount: {
        type: Number,
        required: [true, 'Amount is required'],
        min: [0, 'Amount cannot be negative']
    },
    currency: {
        type: String,
        default: 'NGN',
        uppercase: true
    },
    status: {
        type: String,
        enum: ['pending', 'initiated', 'processing', 'success', 'failed', 'refunded', 'cancelled'],
        default: 'pending'
    },
    paymentMethod: {
        type: String,
        enum: ['card', 'bank_transfer', 'ussd', 'paystack', 'wallet'],
        default: 'paystack'
    },
    paystack: {
        reference: {
            type: String,
            unique: true,
            sparse: true
        },
        accessCode: String,
        authorizationUrl: String,
        transactionId: Number,
        channel: String,
        cardType: String,
        bank: String,
        last4: String,
        authorizationCode: String
    },
    fees: {
        amount: { type: Number, default: 0 },
        currency: { type: String, default: 'NGN' }
    },
    paidAt: {
        type: Date,
        default: null
    },
    refundedAt: {
        type: Date,
        default: null
    },
    refundAmount: {
        type: Number,
        default: 0
    },
    metadata: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    },
    failureReason: {
        type: String,
        default: null
    },
    callbackReceived: {
        type: Boolean,
        default: false
    },
    callbackData: {
        type: mongoose.Schema.Types.Mixed,
        default: null
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});
paymentSchema.index({ user: 1, createdAt: -1 });
paymentSchema.index({ status: 1 });
paymentSchema.index({ 'paystack.reference': 1 });
paymentSchema.index({ appointment: 1 });
module.exports = mongoose.model('Payment', paymentSchema);
//# sourceMappingURL=Payment.js.map
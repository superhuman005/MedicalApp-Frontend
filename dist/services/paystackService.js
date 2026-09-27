const axios = require('axios');
const crypto = require('crypto');
const { Payment, Appointment, Subscription, User } = require('../models');
const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;
const PAYSTACK_BASE_URL = process.env.PAYSTACK_BASE_URL || 'https://api.paystack.co';
const paystackClient = axios.create({
    baseURL: PAYSTACK_BASE_URL,
    headers: {
        'Authorization': `Bearer ${PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json'
    }
});
class PaystackService {
    async initializeTransaction(paymentData) {
        try {
            const { amount, email, reference, callbackUrl, metadata } = paymentData;
            const response = await paystackClient.post('/transaction/initialize', {
                amount: amount * 100,
                email,
                reference: reference || this.generateReference(),
                callback_url: callbackUrl,
                metadata
            });
            return {
                success: true,
                data: response.data.data
            };
        }
        catch (error) {
            console.error('Paystack Initialize Error:', error.response?.data || error.message);
            return {
                success: false,
                error: error.response?.data?.message || 'Failed to initialize transaction'
            };
        }
    }
    async verifyTransaction(reference) {
        try {
            const response = await paystackClient.get(`/transaction/verify/${encodeURIComponent(reference)}`);
            return {
                success: true,
                data: response.data.data
            };
        }
        catch (error) {
            console.error('Paystack Verify Error:', error.response?.data || error.message);
            return {
                success: false,
                error: error.response?.data?.message || 'Failed to verify transaction'
            };
        }
    }
    async chargeAuthorization(authorizationCode, amount, email) {
        try {
            const response = await paystackClient.post('/transaction/charge_authorization', {
                authorization_code: authorizationCode,
                amount: amount * 100,
                email
            });
            return {
                success: true,
                data: response.data.data
            };
        }
        catch (error) {
            console.error('Paystack Charge Authorization Error:', error.response?.data || error.message);
            return {
                success: false,
                error: error.response?.data?.message || 'Failed to charge authorization'
            };
        }
    }
    generateReference() {
        const timestamp = Date.now();
        const random = crypto.randomBytes(4).toString('hex');
        return `MED-${timestamp}-${random}`.toUpperCase();
    }
    verifyWebhookSignature(payload, signature) {
        const hash = crypto
            .createHmac('sha512', PAYSTACK_SECRET_KEY)
            .update(JSON.stringify(payload))
            .digest('hex');
        return hash === signature;
    }
    async createPlan(planData) {
        try {
            const { name, amount, interval, description } = planData;
            const response = await paystackClient.post('/plan', {
                name,
                amount: amount * 100,
                interval,
                description
            });
            return {
                success: true,
                data: response.data.data
            };
        }
        catch (error) {
            console.error('Paystack Create Plan Error:', error.response?.data || error.message);
            return {
                success: false,
                error: error.response?.data?.message || 'Failed to create plan'
            };
        }
    }
    async createSubscription(subscriberEmail, planCode) {
        try {
            const response = await paystackClient.post('/subscription', {
                customer: subscriberEmail,
                plan: planCode
            });
            return {
                success: true,
                data: response.data.data
            };
        }
        catch (error) {
            console.error('Paystack Create Subscription Error:', error.response?.data || error.message);
            return {
                success: false,
                error: error.response?.data?.message || 'Failed to create subscription'
            };
        }
    }
    async cancelSubscription(subscriptionCode) {
        try {
            const response = await paystackClient.post('/subscription/disable', {
                code: subscriptionCode
            });
            return {
                success: true,
                data: response.data.data
            };
        }
        catch (error) {
            console.error('Paystack Cancel Subscription Error:', error.response?.data || error.message);
            return {
                success: false,
                error: error.response?.data?.message || 'Failed to cancel subscription'
            };
        }
    }
    async listBanks() {
        try {
            const response = await paystackClient.get('/bank');
            return {
                success: true,
                data: response.data.data
            };
        }
        catch (error) {
            console.error('Paystack List Banks Error:', error.response?.data || error.message);
            return {
                success: false,
                error: error.response?.data?.message || 'Failed to list banks'
            };
        }
    }
    async verifyAccountNumber(accountNumber, bankCode) {
        try {
            const response = await paystackClient.get(`/bank/resolve?account_number=${accountNumber}&bank_code=${bankCode}`);
            return {
                success: true,
                data: response.data.data
            };
        }
        catch (error) {
            console.error('Paystack Verify Account Error:', error.response?.data || error.message);
            return {
                success: false,
                error: error.response?.data?.message || 'Failed to verify account number'
            };
        }
    }
}
module.exports = new PaystackService();
//# sourceMappingURL=paystackService.js.map
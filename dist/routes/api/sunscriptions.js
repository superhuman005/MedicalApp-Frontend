const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { protect, authorize } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const subscriptionController = require('../../controllers/subscriptionController');
const createSubscriptionValidation = [
    body('plan').isIn(['basic', 'standard', 'premium', 'family']).withMessage('Invalid subscription plan'),
    body('billingCycle').optional().isIn(['monthly', 'quarterly', 'yearly']).withMessage('Invalid billing cycle'),
    validate
];
const upgradeValidation = [
    body('plan').isIn(['basic', 'standard', 'premium', 'family']).withMessage('Invalid subscription plan'),
    validate
];
router.route('/plans')
    .get(subscriptionController.getPlans);
router.use(protect);
router.route('/current')
    .get(subscriptionController.getCurrentSubscription);
router.route('/')
    .get(subscriptionController.getSubscriptionHistory)
    .post(createSubscriptionValidation, subscriptionController.createSubscription);
router.route('/upgrade')
    .post(upgradeValidation, subscriptionController.upgradeSubscription);
router.route('/cancel')
    .post(subscriptionController.cancelSubscription);
router.route('/reactivate')
    .post(subscriptionController.reactivateSubscription);
router.route('/all')
    .get(authorize('admin'), subscriptionController.getAllSubscriptions);
module.exports = router;
//# sourceMappingURL=sunscriptions.js.map
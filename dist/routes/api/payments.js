const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { protect, authorize } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const paymentController = require('../../controllers/paymentController');
const initializePaymentValidation = [
    body('appointmentId').optional().isMongoId().withMessage('Invalid appointment ID'),
    body('subscriptionId').optional().isMongoId().withMessage('Invalid subscription ID'),
    body('amount').optional().isFloat({ min: 0 }).withMessage('Amount must be a positive number'),
    body('currency').optional().isString().isLength({ min: 3, max: 3 }).withMessage('Currency must be 3 characters'),
    validate
];
router.post('/webhook', paymentController.handleWebhook);
router.use(protect);
router.route('/')
    .get(paymentController.getPaymentHistory);
router.route('/initialize')
    .post(initializePaymentValidation, paymentController.initializePayment);
router.route('/verify/:reference')
    .get(paymentController.verifyPayment);
router.route('/:id')
    .get(paymentController.getPayment);
router.route('/:id/refund')
    .post(authorize('admin'), paymentController.refundPayment);
module.exports = router;
//# sourceMappingURL=payments.js.map
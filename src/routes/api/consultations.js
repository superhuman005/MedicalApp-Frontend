const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { protect, authorize } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const consultationController = require('../../controllers/consultationController');

const feedbackValidation = [
  body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
  body('comment').optional().isString().isLength({ max: 500 }).withMessage('Comment cannot exceed 500 characters'),
  validate
];

const updateConsultationValidation = [
  body('symptoms').optional().isArray(),
  body('diagnosis').optional().isObject(),
  body('treatmentPlan').optional().isObject(),
  body('prescriptions').optional().isArray(),
  body('doctorNotes').optional().isString().isLength({ max: 2000 }).withMessage('Notes cannot exceed 2000 characters'),
  body('referral').optional().isObject(),
  body('followUp').optional().isObject(),
  validate
];

router.use(protect);

router.route('/')
  .get(consultationController.getConsultations);

router.route('/:id')
  .get(consultationController.getConsultation)
  .put(authorize('doctor'), updateConsultationValidation, consultationController.updateConsultation);

router.route('/appointment/:appointmentId/start')
  .post(authorize('doctor'), consultationController.startConsultation);

router.route('/:id/end')
  .post(authorize('doctor'), consultationController.endConsultation);

router.route('/:id/feedback')
  .post(authorize('patient'), feedbackValidation, consultationController.submitFeedback);

module.exports = router;

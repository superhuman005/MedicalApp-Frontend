const express = require('express');
const router = express.Router();
const { body, query } = require('express-validator');
const { protect, authorize } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const doctorController = require('../../controllers/doctorController');

const createDoctorValidation = [
  body('specialization').notEmpty().withMessage('Specialization is required'),
  body('qualification').notEmpty().withMessage('Qualification is required'),
  body('medicalLicenseNumber').notEmpty().withMessage('Medical license number is required'),
  body('yearsOfExperience').isInt({ min: 0 }).withMessage('Years of experience must be a positive number'),
  body('consultationFee').isFloat({ min: 0 }).withMessage('Consultation fee is required'),
  validate
];

const reviewValidation = [
  body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
  body('comment').notEmpty().withMessage('Comment is required').isLength({ max: 500 }).withMessage('Comment cannot exceed 500 characters'),
  body('title').optional().isLength({ max: 100 }).withMessage('Title cannot exceed 100 characters'),
  validate
];

router.route('/')
  .get(doctorController.getDoctors);

router.route('/:id')
  .get(doctorController.getDoctor);

router.route('/:id/schedule')
  .get(doctorController.getDoctorSchedule);

router.route('/:id/reviews')
  .get(doctorController.getDoctorReviews);

router.use(protect);

router.route('/profile')
  .post(createDoctorValidation, doctorController.createDoctorProfile)
  .put(doctorController.updateDoctorProfile);

router.route('/:id/verify')
  .post(authorize('admin'), doctorController.verifyDoctor);

router.route('/:id/review')
  .post(authorize('patient'), reviewValidation, doctorController.addReview);

module.exports = router;

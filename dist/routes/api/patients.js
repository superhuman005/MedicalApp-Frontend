const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { protect, authorize } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const patientController = require('../../controllers/patientController');
const createPatientValidation = [
    body('dateOfBirth').isISO8601().withMessage('Invalid date of birth'),
    body('gender').isIn(['male', 'female', 'other']).withMessage('Gender must be male, female, or other'),
    validate
];
const updatePatientValidation = [
    body('dateOfBirth').optional().isISO8601().withMessage('Invalid date of birth'),
    body('gender').optional().isIn(['male', 'female', 'other']).withMessage('Gender must be male, female, or other'),
    body('bloodGroup').optional().isIn(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'unknown']).withMessage('Invalid blood group'),
    validate
];
router.use(protect);
router.route('/profile')
    .get(patientController.getPatientProfile)
    .post(createPatientValidation, patientController.createPatientProfile)
    .put(updatePatientValidation, patientController.updatePatientProfile);
router.route('/dashboard')
    .get(authorize('patient'), patientController.getPatientDashboard);
router.route('/medical-history')
    .get(authorize('patient'), patientController.getPatientMedicalHistory);
router.route('/appointments')
    .get(authorize('patient'), patientController.getPatientAppointments);
router.route('/doctors')
    .get(authorize('patient'), patientController.getPatientDoctors);
router.route('/all')
    .get(authorize('doctor', 'admin'), patientController.getAllPatients);
module.exports = router;
//# sourceMappingURL=patients.js.map
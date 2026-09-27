const express = require('express');
const router = express.Router();
const { body, query } = require('express-validator');
const { protect, authorize } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const medicalRecordController = require('../../controllers/medicalRecordController');
const createRecordValidation = [
    body('patientId').isMongoId().withMessage('Invalid patient ID'),
    body('title').notEmpty().withMessage('Title is required'),
    body('type').isIn(['consultation', 'lab-result', 'prescription', 'imaging', 'surgery', 'vaccination', 'other']).withMessage('Invalid record type'),
    body('description').notEmpty().withMessage('Description is required'),
    body('diagnosis.primary').notEmpty().withMessage('Primary diagnosis is required'),
    validate
];
router.use(protect);
router.route('/')
    .get(medicalRecordController.getMedicalRecords)
    .post(authorize('doctor'), createRecordValidation, medicalRecordController.createMedicalRecord);
router.route('/patient/:patientId/summary')
    .get(medicalRecordController.getPatientSummary);
router.route('/:id')
    .get(medicalRecordController.getMedicalRecord)
    .put(authorize('doctor'), medicalRecordController.updateMedicalRecord)
    .delete(authorize('doctor', 'admin'), medicalRecordController.deleteMedicalRecord);
module.exports = router;
//# sourceMappingURL=medicalRecords.js.map
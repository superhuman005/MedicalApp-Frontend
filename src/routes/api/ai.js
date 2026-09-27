const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { protect, authorize } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const aiController = require('../../controllers/aiController');

const analyzeSymptomsValidation = [
  body('symptoms').isArray({ min: 1 }).withMessage('Symptoms must be a non-empty array'),
  body('symptoms.*').isString().notEmpty().withMessage('Each symptom must be a non-empty string'),
  body('age').optional().isInt({ min: 0, max: 150 }).withMessage('Age must be between 0 and 150'),
  body('gender').optional().isIn(['male', 'female', 'other']).withMessage('Gender must be male, female, or other'),
  body('duration').optional().isString(),
  validate
];

const chatValidation = [
  body('message').isString().notEmpty().withMessage('Message is required').isLength({ max: 2000 }).withMessage('Message cannot exceed 2000 characters'),
  body('context').optional().isString(),
  body('sessionId').optional().isString(),
  validate
];

router.post('/symptoms/analyze', analyzeSymptomsValidation, aiController.analyzeSymptoms);

router.post('/chat', protect, chatValidation, aiController.chatWithAI);

router.get('/records/summarize/:patientId', protect, aiController.summarizeMedicalRecords);

router.get('/predict-risks', protect, aiController.predictHealthRisks);

router.get('/suggest-appointments', protect, aiController.suggestAppointments);

router.get('/symptoms', (req, res) => {
  const symptomDatabase = require('../../utils/symptomDatabase');
  res.json({
    success: true,
    data: symptomDatabase.getAllSymptoms()
  });
});

router.get('/symptoms/urgency/:level', (req, res) => {
  const symptomDatabase = require('../../utils/symptomDatabase');
  const { level } = req.params;

  if (!['emergency', 'urgent', 'routine'].includes(level)) {
    return res.status(400).json({
      success: false,
      message: 'Urgency level must be emergency, urgent, or routine'
    });
  }

  res.json({
    success: true,
    data: symptomDatabase.getSymptomsByUrgency(level)
  });
});

router.get('/medications/search', (req, res) => {
  const medicationDatabase = require('../../utils/medicationDatabase');
  const { q } = req.query;

  if (!q) {
    return res.status(400).json({
      success: false,
      message: 'Search query is required'
    });
  }

  res.json({
    success: true,
    data: medicationDatabase.searchMedications(q)
  });
});

router.get('/medications/:name', (req, res) => {
  const medicationDatabase = require('../../utils/medicationDatabase');
  const { name } = req.params;

  const medication = medicationDatabase.getMedicationInfo(name);

  if (!medication) {
    return res.status(404).json({
      success: false,
      message: 'Medication not found'
    });
  }

  res.json({
    success: true,
    data: { name, ...medication }
  });
});

router.post('/medications/interactions', (req, res) => {
  const medicationDatabase = require('../../utils/medicationDatabase');
  const { medication1, medication2 } = req.body;

  if (!medication1 || !medication2) {
    return res.status(400).json({
      success: false,
      message: 'Both medications are required'
    });
  }

  res.json({
    success: true,
    data: medicationDatabase.checkInteractions(medication1, medication2)
  });
});

module.exports = router;

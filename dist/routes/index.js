const express = require('express');
const router = express.Router();
const authRoutes = require('./api/auth');
const appointmentRoutes = require('./api/appointments');
const medicalRecordRoutes = require('./api/medicalRecords');
const consultationRoutes = require('./api/consultations');
const doctorRoutes = require('./api/doctors');
const patientRoutes = require('./api/patients');
const paymentRoutes = require('./api/payments');
const subscriptionRoutes = require('./api/subscriptions');
const aiRoutes = require('./api/ai');
router.get('/health', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Medical App API is running',
        timestamp: new Date().toISOString()
    });
});
router.use('/auth', authRoutes);
router.use('/appointments', appointmentRoutes);
router.use('/medical-records', medicalRecordRoutes);
router.use('/consultations', consultationRoutes);
router.use('/doctors', doctorRoutes);
router.use('/patients', patientRoutes);
router.use('/payments', paymentRoutes);
router.use('/subscriptions', subscriptionRoutes);
router.use('/ai', aiRoutes);
module.exports = router;
//# sourceMappingURL=index.js.map
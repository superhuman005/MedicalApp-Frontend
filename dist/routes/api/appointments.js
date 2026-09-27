const express = require('express');
const router = express.Router();
const { body, query } = require('express-validator');
const { protect, authorize } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const appointmentController = require('../../controllers/appointmentController');
const createAppointmentValidation = [
    body('doctorId').isMongoId().withMessage('Invalid doctor ID'),
    body('date').isISO8601().withMessage('Invalid date format'),
    body('startTime').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Invalid start time'),
    body('type').isIn(['consultation', 'follow-up', 'emergency', 'routine-checkup', 'video-consultation']).withMessage('Invalid appointment type'),
    body('reason').notEmpty().withMessage('Reason is required'),
    validate
];
const updateAppointmentValidation = [
    body('status').optional().isIn(['pending', 'confirmed', 'in-progress', 'completed', 'cancelled', 'no-show', 'rescheduled']).withMessage('Invalid status'),
    validate
];
const cancelAppointmentValidation = [
    body('reason').optional().isString(),
    validate
];
const rescheduleValidation = [
    body('date').isISO8601().withMessage('Invalid date format'),
    body('startTime').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Invalid start time'),
    validate
];
router.use(protect);
router.route('/')
    .get(appointmentController.getAppointments)
    .post(authorize('patient'), createAppointmentValidation, appointmentController.createAppointment);
router.route('/available-slots')
    .get([
    query('doctorId').isMongoId().withMessage('Invalid doctor ID'),
    query('date').isISO8601().withMessage('Invalid date format'),
    validate
], appointmentController.getAvailableSlots);
router.route('/:id')
    .get(appointmentController.getAppointment)
    .put(updateAppointmentValidation, appointmentController.updateAppointment)
    .delete(cancelAppointmentValidation, appointmentController.cancelAppointment);
router.route('/:id/cancel')
    .post(cancelAppointmentValidation, appointmentController.cancelAppointment);
router.route('/:id/reschedule')
    .post(rescheduleValidation, appointmentController.rescheduleAppointment);
module.exports = router;
//# sourceMappingURL=appointments.js.map
const moment = require('moment');
const { Appointment, Doctor, Patient, Consultation } = require('../models');
const { asyncHandler } = require('../routes/middleware/validate');
const emailService = require('../services/emailService');
exports.getAppointments = asyncHandler(async (req, res) => {
    const { status, startDate, endDate, doctorId } = req.query;
    let query = {};
    if (req.user.role === 'patient') {
        const patient = await Patient.findOne({ user: req.user.id });
        query.patient = patient._id;
    }
    else if (req.user.role === 'doctor') {
        const doctor = await Doctor.findOne({ user: req.user.id });
        query.doctor = doctor._id;
    }
    if (status)
        query.status = status;
    if (doctorId)
        query.doctor = doctorId;
    if (startDate || endDate) {
        query.date = {};
        if (startDate)
            query.date.$gte = new Date(startDate);
        if (endDate)
            query.date.$lte = new Date(endDate);
    }
    const appointments = await Appointment.find(query)
        .populate('patient', '-password')
        .populate({
        path: 'patient',
        populate: { path: 'user', select: 'firstName lastName email phone avatar' }
    })
        .populate({
        path: 'doctor',
        populate: { path: 'user', select: 'firstName lastName email phone avatar' }
    })
        .sort({ date: 1, startTime: 1 });
    res.status(200).json({
        success: true,
        count: appointments.length,
        data: appointments
    });
});
exports.getAppointment = asyncHandler(async (req, res) => {
    const appointment = await Appointment.findById(req.params.id)
        .populate({
        path: 'patient',
        populate: { path: 'user', select: 'firstName lastName email phone avatar' }
    })
        .populate({
        path: 'doctor',
        populate: { path: 'user', select: 'firstName lastName email phone avatar' }
    })
        .populate('consultation');
    if (!appointment) {
        return res.status(404).json({
            success: false,
            message: 'Appointment not found'
        });
    }
    const hasAccess = await checkAppointmentAccess(req.user, appointment);
    if (!hasAccess) {
        return res.status(403).json({
            success: false,
            message: 'Not authorized to access this appointment'
        });
    }
    res.status(200).json({
        success: true,
        data: appointment
    });
});
exports.createAppointment = asyncHandler(async (req, res) => {
    const { doctorId, date, startTime, type, reason, symptoms } = req.body;
    const patient = await Patient.findOne({ user: req.user.id });
    if (!patient) {
        return res.status(404).json({
            success: false,
            message: 'Patient profile not found'
        });
    }
    const doctor = await Doctor.findById(doctorId).populate('user');
    if (!doctor || !doctor.isAvailable) {
        return res.status(404).json({
            success: false,
            message: 'Doctor not found or not available'
        });
    }
    const appointmentDate = moment(date).startOf('day').toDate();
    const dayOfWeek = moment(appointmentDate).format('dddd').toLowerCase();
    if (!doctor.availableDays.includes(dayOfWeek)) {
        return res.status(400).json({
            success: false,
            message: 'Doctor is not available on this day'
        });
    }
    const startMoment = moment(startTime, 'HH:mm');
    const endMoment = moment(startTime, 'HH:mm').add(30, 'minutes');
    const availableStart = moment(doctor.availableHours.start, 'HH:mm');
    const availableEnd = moment(doctor.availableHours.end, 'HH:mm');
    if (startMoment.isBefore(availableStart) || endMoment.isAfter(availableEnd)) {
        return res.status(400).json({
            success: false,
            message: 'Time slot is outside doctor\'s available hours'
        });
    }
    const existingAppointment = await Appointment.findOne({
        doctor: doctorId,
        date: appointmentDate,
        startTime,
        status: { $nin: ['cancelled', 'no-show'] }
    });
    if (existingAppointment) {
        return res.status(400).json({
            success: false,
            message: 'This time slot is already booked'
        });
    }
    const appointment = await Appointment.create({
        patient: patient._id,
        doctor: doctorId,
        date: appointmentDate,
        startTime,
        endTime: endMoment.format('HH:mm'),
        type,
        reason,
        symptoms: symptoms || [],
        fee: {
            amount: doctor.consultationFee,
            currency: 'NGN',
            isPaid: false
        },
        status: 'pending'
    });
    const populatedAppointment = await Appointment.findById(appointment._id)
        .populate({
        path: 'patient',
        populate: { path: 'user', select: 'firstName lastName email' }
    })
        .populate({
        path: 'doctor',
        populate: { path: 'user', select: 'firstName lastName email' }
    });
    await emailService.sendAppointmentConfirmation(req.user.email, {
        patientName: `${req.user.firstName} ${req.user.lastName}`,
        doctorName: `${doctor.user.firstName} ${doctor.user.lastName}`,
        date: moment(appointmentDate).format('MMMM Do YYYY'),
        time: startTime,
        type
    });
    res.status(201).json({
        success: true,
        data: populatedAppointment
    });
});
exports.updateAppointment = asyncHandler(async (req, res) => {
    const { status, notes, prescription, diagnosis } = req.body;
    let appointment = await Appointment.findById(req.params.id);
    if (!appointment) {
        return res.status(404).json({
            success: false,
            message: 'Appointment not found'
        });
    }
    const hasAccess = await checkAppointmentAccess(req.user, appointment);
    if (!hasAccess) {
        return res.status(403).json({
            success: false,
            message: 'Not authorized to update this appointment'
        });
    }
    if (req.user.role === 'doctor' && status === 'completed') {
        if (notes)
            appointment.notes = notes;
        if (prescription)
            appointment.prescription = prescription;
        if (diagnosis)
            appointment.diagnosis = diagnosis;
    }
    if (status)
        appointment.status = status;
    await appointment.save();
    appointment = await Appointment.findById(appointment._id)
        .populate({
        path: 'patient',
        populate: { path: 'user', select: 'firstName lastName email' }
    })
        .populate({
        path: 'doctor',
        populate: { path: 'user', select: 'firstName lastName email' }
    });
    res.status(200).json({
        success: true,
        data: appointment
    });
});
exports.cancelAppointment = asyncHandler(async (req, res) => {
    const { reason } = req.body;
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) {
        return res.status(404).json({
            success: false,
            message: 'Appointment not found'
        });
    }
    const hasAccess = await checkAppointmentAccess(req.user, appointment);
    if (!hasAccess) {
        return res.status(403).json({
            success: false,
            message: 'Not authorized to cancel this appointment'
        });
    }
    const hoursUntilAppointment = moment(appointment.date)
        .set('hour', parseInt(appointment.startTime.split(':')[0]))
        .set('minute', parseInt(appointment.startTime.split(':')[1]))
        .diff(moment(), 'hours');
    if (hoursUntilAppointment < 24) {
        return res.status(400).json({
            success: false,
            message: 'Cannot cancel appointment less than 24 hours before'
        });
    }
    appointment.status = 'cancelled';
    appointment.cancelledAt = new Date();
    appointment.cancelledBy = req.user.id;
    appointment.cancellationReason = reason;
    await appointment.save();
    const doctor = await Doctor.findById(appointment.doctor).populate('user');
    const patient = await Patient.findById(appointment.patient).populate('user');
    await emailService.sendAppointmentCancelled(req.user.email, {
        cancelledByName: `${req.user.firstName} ${req.user.lastName}`,
        doctorName: `${doctor.user.firstName} ${doctor.user.lastName}`,
        patientName: `${patient.user.firstName} ${patient.user.lastName}`,
        date: moment(appointment.date).format('MMMM Do YYYY'),
        time: appointment.startTime,
        reason: reason || 'No reason provided'
    });
    res.status(200).json({
        success: true,
        message: 'Appointment cancelled successfully'
    });
});
exports.rescheduleAppointment = asyncHandler(async (req, res) => {
    const { date, startTime } = req.body;
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) {
        return res.status(404).json({
            success: false,
            message: 'Appointment not found'
        });
    }
    const hasAccess = await checkAppointmentAccess(req.user, appointment);
    if (!hasAccess) {
        return res.status(403).json({
            success: false,
            message: 'Not authorized to reschedule this appointment'
        });
    }
    const newDate = moment(date).startOf('day').toDate();
    const newEndTime = moment(startTime, 'HH:mm').add(30, 'minutes').format('HH:mm');
    const doctor = await Doctor.findById(appointment.doctor);
    const dayOfWeek = moment(newDate).format('dddd').toLowerCase();
    if (!doctor.availableDays.includes(dayOfWeek)) {
        return res.status(400).json({
            success: false,
            message: 'Doctor is not available on this day'
        });
    }
    const existingAppointment = await Appointment.findOne({
        doctor: appointment.doctor,
        date: newDate,
        startTime,
        status: { $nin: ['cancelled', 'no-show'] },
        _id: { $ne: appointment._id }
    });
    if (existingAppointment) {
        return res.status(400).json({
            success: false,
            message: 'This time slot is already booked'
        });
    }
    appointment.date = newDate;
    appointment.startTime = startTime;
    appointment.endTime = newEndTime;
    appointment.status = 'rescheduled';
    await appointment.save();
    res.status(200).json({
        success: true,
        data: appointment
    });
});
exports.getAvailableSlots = asyncHandler(async (req, res) => {
    const { doctorId, date } = req.query;
    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
        return res.status(404).json({
            success: false,
            message: 'Doctor not found'
        });
    }
    const appointmentDate = moment(date).startOf('day').toDate();
    const dayOfWeek = moment(appointmentDate).format('dddd').toLowerCase();
    if (!doctor.availableDays.includes(dayOfWeek)) {
        return res.status(200).json({
            success: true,
            data: [],
            message: 'Doctor is not available on this day'
        });
    }
    const bookedAppointments = await Appointment.find({
        doctor: doctorId,
        date: appointmentDate,
        status: { $nin: ['cancelled', 'no-show'] }
    }).select('startTime endTime');
    const availableSlots = [];
    const { start, end } = doctor.availableHours;
    let currentSlot = moment(start, 'HH:mm');
    const endTime = moment(end, 'HH:mm');
    const slotDuration = 30;
    while (currentSlot.add(slotDuration, 'minutes').isBefore(endTime) || currentSlot.isSame(endTime)) {
        const slotStart = moment(currentSlot).subtract(slotDuration, 'minutes').format('HH:mm');
        const slotEnd = currentSlot.format('HH:mm');
        const isBooked = bookedAppointments.some(app => app.startTime === slotStart);
        if (!isBooked && moment().isBefore(moment(appointmentDate).set('hour', parseInt(slotStart.split(':')[0])).set('minute', parseInt(slotStart.split(':')[1])))) {
            availableSlots.push({
                startTime: slotStart,
                endTime: slotEnd,
                available: true
            });
        }
        currentSlot.add(slotDuration, 'minutes');
    }
    res.status(200).json({
        success: true,
        data: availableSlots
    });
});
const checkAppointmentAccess = async (user, appointment) => {
    if (user.role === 'admin')
        return true;
    if (user.role === 'patient') {
        const patient = await Patient.findOne({ user: user.id });
        return appointment.patient.toString() === patient._id.toString();
    }
    if (user.role === 'doctor') {
        const doctor = await Doctor.findOne({ user: user.id });
        return appointment.doctor.toString() === doctor._id.toString();
    }
    return false;
};
//# sourceMappingURL=appointmentController.js.map
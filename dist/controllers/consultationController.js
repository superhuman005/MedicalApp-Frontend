const moment = require('moment');
const { Consultation, Appointment, Doctor, Patient, MedicalRecord } = require('../models');
const { asyncHandler } = require('../routes/middleware/validate');
const emailService = require('../services/emailService');
exports.getConsultations = asyncHandler(async (req, res) => {
    const { status, startDate, endDate } = req.query;
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
    if (startDate || endDate) {
        query.createdAt = {};
        if (startDate)
            query.createdAt.$gte = new Date(startDate);
        if (endDate)
            query.createdAt.$lte = new Date(endDate);
    }
    const consultations = await Consultation.find(query)
        .populate({
        path: 'appointment',
        populate: [
            { path: 'patient', populate: { path: 'user', select: 'firstName lastName' } },
            { path: 'doctor', populate: { path: 'user', select: 'firstName lastName' } }
        ]
    })
        .populate({
        path: 'patient',
        populate: { path: 'user', select: 'firstName lastName email' }
    })
        .populate({
        path: 'doctor',
        populate: { path: 'user', select: 'firstName lastName' }
    })
        .sort({ createdAt: -1 });
    res.status(200).json({
        success: true,
        count: consultations.length,
        data: consultations
    });
});
exports.getConsultation = asyncHandler(async (req, res) => {
    const consultation = await Consultation.findById(req.params.id)
        .populate({
        path: 'appointment',
        populate: [
            { path: 'patient', populate: { path: 'user', select: 'firstName lastName email phone' } },
            { path: 'doctor', populate: { path: 'user', select: 'firstName lastName email' } }
        ]
    })
        .populate({
        path: 'patient',
        populate: { path: 'user', select: 'firstName lastName email phone' }
    })
        .populate({
        path: 'doctor',
        populate: { path: 'user', select: 'firstName lastName specializations' }
    })
        .populate('referral.referredTo');
    if (!consultation) {
        return res.status(404).json({
            success: false,
            message: 'Consultation not found'
        });
    }
    const hasAccess = await checkConsultationAccess(req.user, consultation);
    if (!hasAccess) {
        return res.status(403).json({
            success: false,
            message: 'Not authorized to access this consultation'
        });
    }
    res.status(200).json({
        success: true,
        data: consultation
    });
});
exports.startConsultation = asyncHandler(async (req, res) => {
    const { appointmentId } = req.params;
    if (req.user.role !== 'doctor') {
        return res.status(403).json({
            success: false,
            message: 'Only doctors can start consultations'
        });
    }
    const doctor = await Doctor.findOne({ user: req.user.id });
    const appointment = await Appointment.findById(appointmentId)
        .populate('patient');
    if (!appointment) {
        return res.status(404).json({
            success: false,
            message: 'Appointment not found'
        });
    }
    if (appointment.doctor.toString() !== doctor._id.toString()) {
        return res.status(403).json({
            success: false,
            message: 'Not authorized to start this consultation'
        });
    }
    if (appointment.status === 'completed' || appointment.status === 'in-progress') {
        return res.status(400).json({
            success: false,
            message: 'Consultation already started or completed'
        });
    }
    let consultation = await Consultation.findOne({ appointment: appointmentId });
    if (!consultation) {
        consultation = await Consultation.create({
            appointment: appointmentId,
            patient: appointment.patient,
            doctor: doctor._id,
            type: appointment.type.includes('video') ? 'video' : 'in-person',
            status: 'in-progress',
            startedAt: new Date()
        });
    }
    else {
        consultation.status = 'in-progress';
        consultation.startedAt = new Date();
        await consultation.save();
    }
    appointment.status = 'in-progress';
    await appointment.save();
    const populatedConsultation = await Consultation.findById(consultation._id)
        .populate({
        path: 'patient',
        populate: { path: 'user', select: 'firstName lastName email' }
    })
        .populate({
        path: 'doctor',
        populate: { path: 'user', select: 'firstName lastName' }
    });
    res.status(200).json({
        success: true,
        data: populatedConsultation
    });
});
exports.updateConsultation = asyncHandler(async (req, res) => {
    const { symptoms, diagnosis, treatmentPlan, prescriptions, doctorNotes, referral, followUp } = req.body;
    if (req.user.role !== 'doctor') {
        return res.status(403).json({
            success: false,
            message: 'Only doctors can update consultations'
        });
    }
    const consultation = await Consultation.findById(req.params.id);
    if (!consultation) {
        return res.status(404).json({
            success: false,
            message: 'Consultation not found'
        });
    }
    const doctor = await Doctor.findOne({ user: req.user.id });
    if (consultation.doctor.toString() !== doctor._id.toString()) {
        return res.status(403).json({
            success: false,
            message: 'Not authorized to update this consultation'
        });
    }
    if (symptoms)
        consultation.symptoms = symptoms;
    if (diagnosis)
        consultation.diagnosis = diagnosis;
    if (treatmentPlan)
        consultation.treatmentPlan = treatmentPlan;
    if (prescriptions)
        consultation.prescriptions = prescriptions;
    if (doctorNotes)
        consultation.doctorNotes = doctorNotes;
    if (referral)
        consultation.referral = { ...consultation.referral, ...referral };
    if (followUp)
        consultation.followUp = { ...consultation.followUp, ...followUp };
    await consultation.save();
    res.status(200).json({
        success: true,
        data: consultation
    });
});
exports.endConsultation = asyncHandler(async (req, res) => {
    if (req.user.role !== 'doctor') {
        return res.status(403).json({
            success: false,
            message: 'Only doctors can end consultations'
        });
    }
    const consultation = await Consultation.findById(req.params.id);
    if (!consultation) {
        return res.status(404).json({
            success: false,
            message: 'Consultation not found'
        });
    }
    const doctor = await Doctor.findOne({ user: req.user.id });
    if (consultation.doctor.toString() !== doctor._id.toString()) {
        return res.status(403).json({
            success: false,
            message: 'Not authorized to end this consultation'
        });
    }
    const endTime = new Date();
    const startTime = consultation.startedAt || consultation.createdAt;
    const duration = Math.round((endTime - startTime) / (1000 * 60));
    consultation.status = 'completed';
    consultation.endedAt = endTime;
    consultation.duration = duration;
    await consultation.save();
    const appointment = await Appointment.findById(consultation.appointment);
    appointment.status = 'completed';
    await appointment.save();
    if (consultation.diagnosis && consultation.diagnosis.primary) {
        await MedicalRecord.create({
            patient: consultation.patient,
            doctor: consultation.doctor,
            appointment: consultation.appointment,
            title: `Consultation - ${consultation.diagnosis.primary}`,
            type: 'consultation',
            description: consultation.doctorNotes || 'Consultation completed',
            diagnosis: consultation.diagnosis,
            treatment: {
                medications: consultation.prescriptions,
                recommendations: consultation.treatmentPlan?.lifestyle?.map(l => l.recommendation).join('; ')
            }
        });
    }
    const populatedConsultation = await Consultation.findById(consultation._id)
        .populate({
        path: 'patient',
        populate: { path: 'user', select: 'firstName lastName email' }
    });
    if (populatedConsultation.patient?.user?.email) {
        await emailService.sendConsultationSummary(populatedConsultation.patient.user.email, {
            patientName: `${populatedConsultation.patient.user.firstName} ${populatedConsultation.patient.user.lastName}`,
            date: moment(consultation.startedAt).format('MMMM Do YYYY'),
            duration: `${duration} minutes`,
            diagnosis: consultation.diagnosis?.primary || 'Not specified'
        });
    }
    res.status(200).json({
        success: true,
        data: consultation
    });
});
exports.submitFeedback = asyncHandler(async (req, res) => {
    const { rating, comment } = req.body;
    if (req.user.role !== 'patient') {
        return res.status(403).json({
            success: false,
            message: 'Only patients can submit consultation feedback'
        });
    }
    const consultation = await Consultation.findById(req.params.id);
    if (!consultation) {
        return res.status(404).json({
            success: false,
            message: 'Consultation not found'
        });
    }
    const patient = await Patient.findOne({ user: req.user.id });
    if (consultation.patient.toString() !== patient._id.toString()) {
        return res.status(403).json({
            success: false,
            message: 'Not authorized to provide feedback for this consultation'
        });
    }
    if (consultation.status !== 'completed') {
        return res.status(400).json({
            success: false,
            message: 'Cannot provide feedback for incomplete consultation'
        });
    }
    consultation.patientFeedback = {
        rating,
        comment,
        submittedAt: new Date()
    };
    await consultation.save();
    const doctor = await Doctor.findById(consultation.doctor);
    const consultationsWithRating = await Consultation.find({
        doctor: consultation.doctor,
        'patientFeedback.rating': { $exists: true }
    });
    const totalRating = consultationsWithRating.reduce((sum, c) => sum + c.patientFeedback.rating, 0);
    doctor.rating.average = totalRating / consultationsWithRating.length;
    doctor.rating.count = consultationsWithRating.length;
    await doctor.save();
    res.status(200).json({
        success: true,
        data: consultation
    });
});
const checkConsultationAccess = async (user, consultation) => {
    if (user.role === 'admin')
        return true;
    if (user.role === 'patient') {
        const patient = await Patient.findOne({ user: user.id });
        return consultation.patient.toString() === patient._id.toString();
    }
    if (user.role === 'doctor') {
        const doctor = await Doctor.findOne({ user: user.id });
        return consultation.doctor.toString() === doctor._id.toString();
    }
    return false;
};
//# sourceMappingURL=consultationController.js.map
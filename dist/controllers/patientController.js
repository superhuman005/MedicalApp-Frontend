const { Patient, User, Appointment, MedicalRecord, Consultation } = require('../models');
const { asyncHandler } = require('../routes/middleware/validate');
exports.getPatientProfile = asyncHandler(async (req, res) => {
    const patient = await Patient.findOne({ user: req.user.id })
        .populate('user', 'firstName lastName email phone avatar');
    if (!patient) {
        return res.status(404).json({
            success: false,
            message: 'Patient profile not found'
        });
    }
    res.status(200).json({
        success: true,
        data: patient
    });
});
exports.createPatientProfile = asyncHandler(async (req, res) => {
    const existingPatient = await Patient.findOne({ user: req.user.id });
    if (existingPatient) {
        return res.status(400).json({
            success: false,
            message: 'Patient profile already exists'
        });
    }
    const patient = await Patient.create({
        user: req.user.id,
        ...req.body
    });
    await User.findByIdAndUpdate(req.user.id, { role: 'patient' });
    const populatedPatient = await Patient.findById(patient._id)
        .populate('user', 'firstName lastName email phone avatar');
    res.status(201).json({
        success: true,
        data: populatedPatient
    });
});
exports.updatePatientProfile = asyncHandler(async (req, res) => {
    const allowedFields = [
        'dateOfBirth',
        'gender',
        'bloodGroup',
        'address',
        'emergencyContact',
        'insurance',
        'allergies',
        'currentMedications',
        'height',
        'weight'
    ];
    const updates = {};
    allowedFields.forEach(field => {
        if (req.body[field] !== undefined) {
            updates[field] = req.body[field];
        }
    });
    const patient = await Patient.findOneAndUpdate({ user: req.user.id }, updates, { new: true, runValidators: true }).populate('user', 'firstName lastName email phone avatar');
    if (!patient) {
        return res.status(404).json({
            success: false,
            message: 'Patient profile not found'
        });
    }
    res.status(200).json({
        success: true,
        data: patient
    });
});
exports.getPatientDashboard = asyncHandler(async (req, res) => {
    const patient = await Patient.findOne({ user: req.user.id });
    if (!patient) {
        return res.status(404).json({
            success: false,
            message: 'Patient profile not found'
        });
    }
    const [upcomingAppointments, recentConsultations, pendingPayments] = await Promise.all([
        Appointment.find({
            patient: patient._id,
            status: { $in: ['confirmed', 'pending'] },
            date: { $gte: new Date() }
        })
            .populate({
            path: 'doctor',
            populate: { path: 'user', select: 'firstName lastName avatar' }
        })
            .sort({ date: 1, startTime: 1 })
            .limit(5),
        Consultation.find({ patient: patient._id, status: 'completed' })
            .populate({
            path: 'doctor',
            populate: { path: 'user', select: 'firstName lastName avatar' }
        })
            .sort({ createdAt: -1 })
            .limit(5),
        Appointment.find({
            patient: patient._id,
            'fee.isPaid': false,
            status: { $ne: 'cancelled' }
        }).select('date fee')
    ]);
    const totalPending = pendingPayments.reduce((sum, apt) => sum + apt.fee.amount, 0);
    res.status(200).json({
        success: true,
        data: {
            upcomingAppointments,
            recentConsultations,
            pendingPayments: {
                total: totalPending,
                appointments: pendingPayments
            }
        }
    });
});
exports.getPatientMedicalHistory = asyncHandler(async (req, res) => {
    const patient = await Patient.findOne({ user: req.user.id });
    if (!patient) {
        return res.status(404).json({
            success: false,
            message: 'Patient profile not found'
        });
    }
    const medicalRecords = await MedicalRecord.find({ patient: patient._id })
        .populate({
        path: 'doctor',
        populate: { path: 'user', select: 'firstName lastName' }
    })
        .sort({ createdAt: -1 });
    const consultations = await Consultation.find({ patient: patient._id })
        .populate({
        path: 'doctor',
        populate: { path: 'user', select: 'firstName lastName' }
    })
        .sort({ createdAt: -1 });
    res.status(200).json({
        success: true,
        data: {
            medicalRecords,
            consultations
        }
    });
});
exports.getPatientAppointments = asyncHandler(async (req, res) => {
    const { status, page = 1, limit = 10 } = req.query;
    const patient = await Patient.findOne({ user: req.user.id });
    if (!patient) {
        return res.status(404).json({
            success: false,
            message: 'Patient profile not found'
        });
    }
    let query = { patient: patient._id };
    if (status)
        query.status = status;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const appointments = await Appointment.find(query)
        .populate({
        path: 'doctor',
        populate: { path: 'user', select: 'firstName lastName avatar phone' }
    })
        .sort({ date: -1, startTime: -1 })
        .skip(skip)
        .limit(parseInt(limit));
    const total = await Appointment.countDocuments(query);
    res.status(200).json({
        success: true,
        count: appointments.length,
        total,
        data: appointments
    });
});
exports.getPatientDoctors = asyncHandler(async (req, res) => {
    const patient = await Patient.findOne({ user: req.user.id });
    if (!patient) {
        return res.status(404).json({
            success: false,
            message: 'Patient profile not found'
        });
    }
    const consultations = await Consultation.find({ patient: patient._id })
        .distinct('doctor');
    const doctors = await Doctor.find({ _id: { $in: consultations } })
        .populate('user', 'firstName lastName avatar phone email');
    res.status(200).json({
        success: true,
        data: doctors
    });
});
exports.getAllPatients = asyncHandler(async (req, res) => {
    if (req.user.role !== 'doctor' && req.user.role !== 'admin') {
        return res.status(403).json({
            success: false,
            message: 'Not authorized to view patients'
        });
    }
    const { page = 1, limit = 10, search } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    let userQuery = {};
    if (search) {
        userQuery.$or = [
            { firstName: { $regex: search, $options: 'i' } },
            { lastName: { $regex: search, $options: 'i' } },
            { email: { $regex: search, $options: 'i' } }
        ];
    }
    let patientQuery = {};
    if (req.user.role === 'doctor') {
        const doctor = await Doctor.findOne({ user: req.user.id });
        const patientIds = await Consultation.find({ doctor: doctor._id }).distinct('patient');
        patientQuery._id = { $in: patientIds };
    }
    const patients = await Patient.find(patientQuery)
        .populate({
        path: 'user',
        select: 'firstName lastName email phone avatar',
        match: userQuery
    })
        .skip(skip)
        .limit(parseInt(limit));
    const filteredPatients = patients.filter(p => p.user);
    const total = await Patient.countDocuments(patientQuery);
    res.status(200).json({
        success: true,
        count: filteredPatients.length,
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        data: filteredPatients
    });
});
//# sourceMappingURL=patientController.js.map
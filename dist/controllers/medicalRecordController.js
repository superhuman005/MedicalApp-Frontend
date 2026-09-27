const { MedicalRecord, Patient, Doctor } = require('../models');
const { asyncHandler } = require('../routes/middleware/validate');
exports.getMedicalRecords = asyncHandler(async (req, res) => {
    const { type, startDate, endDate } = req.query;
    let query = {};
    if (req.user.role === 'patient') {
        const patient = await Patient.findOne({ user: req.user.id });
        query.patient = patient._id;
    }
    else if (req.user.role === 'doctor') {
        const doctor = await Doctor.findOne({ user: req.user.id });
        query.doctor = doctor._id;
    }
    if (type)
        query.type = type;
    if (startDate || endDate) {
        query.createdAt = {};
        if (startDate)
            query.createdAt.$gte = new Date(startDate);
        if (endDate)
            query.createdAt.$lte = new Date(endDate);
    }
    const records = await MedicalRecord.find(query)
        .populate({
        path: 'patient',
        populate: { path: 'user', select: 'firstName lastName' }
    })
        .populate({
        path: 'doctor',
        populate: { path: 'user', select: 'firstName lastName' }
    })
        .sort({ createdAt: -1 });
    if (req.user.role !== 'admin') {
        const patient = await Patient.findOne({ user: req.user.id });
        if (patient) {
            await MedicalRecord.updateMany({ _id: { $in: records.map(r => r._id) } }, {
                $push: {
                    accessLog: {
                        user: req.user.id,
                        action: 'view',
                        timestamp: new Date()
                    }
                }
            });
        }
    }
    res.status(200).json({
        success: true,
        count: records.length,
        data: records
    });
});
exports.getMedicalRecord = asyncHandler(async (req, res) => {
    const record = await MedicalRecord.findById(req.params.id)
        .populate({
        path: 'patient',
        populate: { path: 'user', select: 'firstName lastName email phone' }
    })
        .populate({
        path: 'doctor',
        populate: { path: 'user', select: 'firstName lastName email' }
    });
    if (!record) {
        return res.status(404).json({
            success: false,
            message: 'Medical record not found'
        });
    }
    const hasAccess = await checkRecordAccess(req.user, record);
    if (!hasAccess) {
        return res.status(403).json({
            success: false,
            message: 'Not authorized to access this medical record'
        });
    }
    await MedicalRecord.findByIdAndUpdate(req.params.id, {
        $push: {
            accessLog: {
                user: req.user.id,
                action: 'view',
                timestamp: new Date()
            }
        }
    });
    res.status(200).json({
        success: true,
        data: record
    });
});
exports.createMedicalRecord = asyncHandler(async (req, res) => {
    if (req.user.role !== 'doctor') {
        return res.status(403).json({
            success: false,
            message: 'Only doctors can create medical records'
        });
    }
    const doctor = await Doctor.findOne({ user: req.user.id });
    if (!doctor) {
        return res.status(404).json({
            success: false,
            message: 'Doctor profile not found'
        });
    }
    const { patientId, ...recordData } = req.body;
    const patient = await Patient.findById(patientId);
    if (!patient) {
        return res.status(404).json({
            success: false,
            message: 'Patient not found'
        });
    }
    const record = await MedicalRecord.create({
        ...recordData,
        patient: patientId,
        doctor: doctor._id
    });
    const populatedRecord = await MedicalRecord.findById(record._id)
        .populate({
        path: 'patient',
        populate: { path: 'user', select: 'firstName lastName' }
    })
        .populate({
        path: 'doctor',
        populate: { path: 'user', select: 'firstName lastName' }
    });
    res.status(201).json({
        success: true,
        data: populatedRecord
    });
});
exports.updateMedicalRecord = asyncHandler(async (req, res) => {
    const record = await MedicalRecord.findById(req.params.id);
    if (!record) {
        return res.status(404).json({
            success: false,
            message: 'Medical record not found'
        });
    }
    if (req.user.role !== 'doctor') {
        return res.status(403).json({
            success: false,
            message: 'Only doctors can update medical records'
        });
    }
    const doctor = await Doctor.findOne({ user: req.user.id });
    if (record.doctor.toString() !== doctor._id.toString()) {
        return res.status(403).json({
            success: false,
            message: 'Not authorized to update this medical record'
        });
    }
    const updatedRecord = await MedicalRecord.findByIdAndUpdate(req.params.id, { $set: req.body }, { new: true, runValidators: true }).populate({
        path: 'patient',
        populate: { path: 'user', select: 'firstName lastName' }
    }).populate({
        path: 'doctor',
        populate: { path: 'user', select: 'first patientName lastName' }
    });
    await MedicalRecord.findByIdAndUpdate(req.params.id, {
        $push: {
            accessLog: {
                user: req.user.id,
                action: 'edit',
                timestamp: new Date()
            }
        }
    });
    res.status(200).json({
        success: true,
        data: updatedRecord
    });
});
exports.deleteMedicalRecord = asyncHandler(async (req, res) => {
    const record = await MedicalRecord.findById(req.params.id);
    if (!record) {
        return res.status(404).json({
            success: false,
            message: 'Medical record not found'
        });
    }
    if (req.user.role !== 'doctor' && req.user.role !== 'admin') {
        return res.status(403).json({
            success: false,
            message: 'Not authorized to delete medical records'
        });
    }
    if (req.user.role === 'doctor') {
        const doctor = await Doctor.findOne({ user: req.user.id });
        if (record.doctor.toString() !== doctor._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to delete this medical record'
            });
        }
    }
    await record.remove();
    res.status(200).json({
        success: true,
        message: 'Medical record deleted successfully'
    });
});
exports.getPatientSummary = asyncHandler(async (req, res) => {
    const patientId = req.params.patientId;
    if (req.user.role === 'patient') {
        const patient = await Patient.findOne({ user: req.user.id });
        if (patient._id.toString() !== patientId) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to access this patient\'s records'
            });
        }
    }
    const records = await MedicalRecord.find({ patient: patientId })
        .populate({
        path: 'doctor',
        populate: { path: 'user', select: 'firstName lastName' }
    })
        .sort({ createdAt: -1 });
    const summary = {
        totalRecords: records.length,
        diagnoses: [],
        medications: [],
        recentVitals: null,
        recentRecords: records.slice(0, 5)
    };
    const diagnosesMap = new Map();
    const medicationsMap = new Map();
    records.forEach(record => {
        if (record.diagnosis && record.diagnosis.primary) {
            const existing = diagnosesMap.get(record.diagnosis.primary) || { count: 0, lastDate: record.createdAt };
            existing.count++;
            if (record.createdAt > existing.lastDate)
                existing.lastDate = record.createdAt;
            diagnosesMap.set(record.diagnosis.primary, existing);
        }
        if (record.treatment && record.treatment.medications) {
            record.treatment.medications.forEach(med => {
                const existing = medicationsMap.get(med.name) || { count: 0, lastDate: record.createdAt };
                existing.count++;
                if (record.createdAt > existing.lastDate)
                    existing.lastDate = record.createdAt;
                medicationsMap.set(med.name, existing);
            });
        }
        if (record.vitals && !summary.recentVitals) {
            summary.recentVitals = {
                ...record.vitals,
                recordedAt: record.createdAt
            };
        }
    });
    summary.diagnoses = Array.from(diagnosesMap.entries())
        .map(([name, data]) => ({ name, ...data }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);
    summary.medications = Array.from(medicationsMap.entries())
        .map(([name, data]) => ({ name, ...data }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);
    res.status(200).json({
        success: true,
        data: summary
    });
});
const checkRecordAccess = async (user, record) => {
    if (user.role === 'admin')
        return true;
    if (user.role === 'patient') {
        const patient = await Patient.findOne({ user: user.id });
        return record.patient.toString() === patient._id.toString();
    }
    if (user.role === 'doctor') {
        const doctor = await Doctor.findOne({ user: user.id });
        return record.doctor.toString() === doctor._id.toString();
    }
    return false;
};
//# sourceMappingURL=medicalRecordController.js.map
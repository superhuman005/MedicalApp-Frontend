const { Doctor, User, Review } = require('../models');
const { asyncHandler } = require('../routes/middleware/validate');
exports.getDoctors = asyncHandler(async (req, res) => {
    const { specialization, minRating, available, search, page = 1, limit = 10 } = req.query;
    let query = { isVerified: true, isAvailable: true };
    if (specialization) {
        query.specialization = { $regex: specialization, $options: 'i' };
    }
    if (available !== undefined) {
        query.isAvailable = available === 'true';
    }
    if (minRating) {
        query['rating.average'] = { $gte: parseFloat(minRating) };
    }
    let userQuery = {};
    if (search) {
        userQuery.$or = [
            { firstName: { $regex: search, $options: 'i' } },
            { lastName: { $regex: search, $options: 'i' } }
        ];
    }
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const doctors = await Doctor.find(query)
        .populate({
        path: 'user',
        select: 'firstName lastName email phone avatar',
        match: userQuery
    })
        .sort({ 'rating.average': -1 })
        .skip(skip)
        .limit(parseInt(limit));
    const filteredDoctors = doctors.filter(d => d.user);
    const total = await Doctor.countDocuments(query);
    res.status(200).json({
        success: true,
        count: filteredDoctors.length,
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        data: filteredDoctors
    });
});
exports.getDoctor = asyncHandler(async (req, res) => {
    const doctor = await Doctor.findById(req.params.id)
        .populate({
        path: 'user',
        select: 'firstName lastName email phone avatar'
    })
        .populate({
        path: 'reviews',
        populate: {
            path: 'patient',
            populate: { path: 'user', select: 'firstName lastName' }
        },
        options: { sort: { createdAt: -1 }, limit: 10 }
    });
    if (!doctor) {
        return res.status(404).json({
            success: false,
            message: 'Doctor not found'
        });
    }
    res.status(200).json({
        success: true,
        data: doctor
    });
});
exports.createDoctorProfile = asyncHandler(async (req, res) => {
    const { specialization, qualification, medicalLicenseNumber, yearsOfExperience, bio, consultationFee, availableDays, availableHours, languages } = req.body;
    const existingDoctor = await Doctor.findOne({ user: req.user.id });
    if (existingDoctor) {
        return res.status(400).json({
            success: false,
            message: 'Doctor profile already exists'
        });
    }
    const doctor = await Doctor.create({
        user: req.user.id,
        specialization,
        qualification,
        medicalLicenseNumber,
        yearsOfExperience,
        bio,
        consultationFee,
        availableDays: availableDays || ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
        availableHours: availableHours || { start: '09:00', end: '17:00' },
        languages: languages || ['English']
    });
    await User.findByIdAndUpdate(req.user.id, { role: 'doctor' });
    const populatedDoctor = await Doctor.findById(doctor._id)
        .populate('user', 'firstName lastName email phone avatar');
    res.status(201).json({
        success: true,
        data: populatedDoctor
    });
});
exports.updateDoctorProfile = asyncHandler(async (req, res) => {
    const allowedFields = [
        'specialization',
        'qualification',
        'yearsOfExperience',
        'bio',
        'consultationFee',
        'availableDays',
        'availableHours',
        'languages',
        'hospitalAffiliations',
        'isAvailable'
    ];
    const updates = {};
    allowedFields.forEach(field => {
        if (req.body[field] !== undefined) {
            updates[field] = req.body[field];
        }
    });
    const doctor = await Doctor.findOneAndUpdate({ user: req.user.id }, updates, { new: true, runValidators: true }).populate('user', 'firstName lastName email phone avatar');
    if (!doctor) {
        return res.status(404).json({
            success: false,
            message: 'Doctor profile not found'
        });
    }
    res.status(200).json({
        success: true,
        data: doctor
    });
});
exports.verifyDoctor = asyncHandler(async (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({
            success: false,
            message: 'Only admins can verify doctors'
        });
    }
    const doctor = await Doctor.findByIdAndUpdate(req.params.id, { isVerified: true }, { new: true }).populate('user', 'firstName lastName email');
    if (!doctor) {
        return res.status(404).json({
            success: false,
            message: 'Doctor not found'
        });
    }
    res.status(200).json({
        success: true,
        message: 'Doctor verified successfully',
        data: doctor
    });
});
exports.getDoctorSchedule = asyncHandler(async (req, res) => {
    const doctor = await Doctor.findById(req.params.id)
        .select('availableDays availableHours isAvailable');
    if (!doctor) {
        return res.status(404).json({
            success: false,
            message: 'Doctor not found'
        });
    }
    res.status(200).json({
        success: true,
        data: {
            availableDays: doctor.availableDays,
            availableHours: doctor.availableHours,
            isAvailable: doctor.isAvailable
        }
    });
});
exports.getDoctorReviews = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const reviews = await Review.find({ doctor: req.params.id })
        .populate({
        path: 'patient',
        populate: { path: 'user', select: 'firstName lastName avatar' }
    })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit));
    const total = await Review.countDocuments({ doctor: req.params.id });
    res.status(200).json({
        success: true,
        count: reviews.length,
        total,
        data: reviews
    });
});
exports.addReview = asyncHandler(async (req, res) => {
    const { rating, title, comment, aspects } = req.body;
    const doctor = await Doctor.findById(req.params.id);
    if (!doctor) {
        return res.status(404).json({
            success: false,
            message: 'Doctor not found'
        });
    }
    const patient = await Patient.findOne({ user: req.user.id });
    if (!patient) {
        return res.status(404).json({
            success: false,
            message: 'Patient profile not found'
        });
    }
    const existingReview = await Review.findOne({
        doctor: req.params.id,
        patient: patient._id
    });
    if (existingReview) {
        return res.status(400).json({
            success: false,
            message: 'You have already reviewed this doctor'
        });
    }
    const review = await Review.create({
        doctor: req.params.id,
        patient: patient._id,
        rating,
        title,
        comment,
        aspects,
        isVerified: true
    });
    const reviews = await Review.find({ doctor: req.params.id });
    const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0) + rating;
    doctor.rating.average = totalRating / (reviews.length + 1);
    doctor.rating.count = reviews.length + 1;
    await doctor.save();
    const populatedReview = await Review.findById(review._id)
        .populate({
        path: 'patient',
        populate: { path: 'user', select: 'firstName lastName avatar' }
    });
    res.status(201).json({
        success: true,
        data: populatedReview
    });
});
//# sourceMappingURL=doctorController.js.map
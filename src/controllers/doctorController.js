const User = require("../models/User");
const catchAsync = require("../utils/catchAsync");
const ApiError = require("../utils/ApiError");

// @desc    List doctors, with optional filters
// @route   GET /api/doctors?specialty=&status=&online=true&search=
// @access  Private
const getDoctors = catchAsync(async (req, res) => {
  const { specialty, status, online, search } = req.query;
  const filter = { role: "doctor", doctorApprovalStatus: "approved" };

  if (specialty) filter.specialization = new RegExp(specialty, "i");
  if (status) filter.status = status;
  if (online === "true") filter.status = { $in: ["online", "available"] };
  if (search) {
    filter.$or = [
      { firstName: new RegExp(search, "i") },
      { lastName: new RegExp(search, "i") },
      { specialization: new RegExp(search, "i") },
    ];
  }

  const doctors = await User.find(filter).sort({ rating: -1 });
  res.status(200).json({ success: true, count: doctors.length, doctors });
});

// @desc    Get a single doctor's public profile
// @route   GET /api/doctors/:id
// @access  Private
const getDoctorById = catchAsync(async (req, res) => {
  const doctor = await User.findOne({ _id: req.params.id, role: "doctor" });
  if (!doctor) throw new ApiError(404, "Doctor not found");
  res.status(200).json({ success: true, doctor });
});

// @desc    Update the logged-in doctor's availability status
// @route   PATCH /api/doctors/me/status
// @access  Private (doctor)
const updateStatus = catchAsync(async (req, res) => {
  const { status } = req.body;
  const allowed = ["online", "offline", "busy", "available"];
  if (!allowed.includes(status)) {
    throw new ApiError(400, `status must be one of: ${allowed.join(", ")}`);
  }

  if (status !== "offline" && req.user.doctorApprovalStatus !== "approved") {
    throw new ApiError(
      403,
      req.user.doctorApprovalStatus === "rejected"
        ? "Your application was not approved, so you can't go online. Contact support."
        : "Your account is awaiting admin approval. You'll be able to go online once approved."
    );
  }

  const doctor = await User.findByIdAndUpdate(
    req.user._id,
    { status },
    { new: true }
  );

  req.app.get("io")?.emit("doctor:status-changed", { doctorId: doctor._id, status: doctor.status });

  res.status(200).json({ success: true, doctor });
});

// @desc    Update the logged-in doctor's profile (bio, fee, experience, etc.)
// @route   PATCH /api/doctors/me/profile
// @access  Private (doctor)
const updateProfile = catchAsync(async (req, res) => {
  const editable = ["bio", "specialization", "yearsOfExperience", "consultationFee", "avatar"];
  const updates = {};
  editable.forEach((field) => {
    if (req.body[field] !== undefined) updates[field] = req.body[field];
  });

  const doctor = await User.findByIdAndUpdate(req.user._id, updates, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({ success: true, doctor });
});

module.exports = { getDoctors, getDoctorById, updateStatus, updateProfile };

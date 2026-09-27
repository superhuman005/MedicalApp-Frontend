const User = require("../models/User");
const catchAsync = require("../utils/catchAsync");
const ApiError = require("../utils/ApiError");

const PATIENT_EDITABLE = ["firstName", "lastName", "phone", "avatar", "dateOfBirth", "gender"];
const DOCTOR_EDITABLE = [
  ...PATIENT_EDITABLE,
  "specialization",
  "yearsOfExperience",
  "bio",
  "consultationFee",
];

// @desc    Update the logged-in user's own profile
// @route   PATCH /api/users/me
// @access  Private
const updateMe = catchAsync(async (req, res) => {
  const allowed = req.user.role === "doctor" ? DOCTOR_EDITABLE : PATIENT_EDITABLE;
  const updates = {};
  allowed.forEach((field) => {
    if (req.body[field] !== undefined) updates[field] = req.body[field];
  });

  const user = await User.findByIdAndUpdate(req.user._id, updates, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({ success: true, user });
});

// @desc    Update avatar URL (after uploading via /api/users/me/avatar)
// @route   POST /api/users/me/avatar
// @access  Private
const uploadAvatar = catchAsync(async (req, res) => {
  if (!req.file) {
    throw new ApiError(400, "No file uploaded");
  }
  const avatarUrl = `/uploads/${req.file.filename}`;
  const user = await User.findByIdAndUpdate(
    req.user._id,
    { avatar: avatarUrl },
    { new: true }
  );
  res.status(200).json({ success: true, user });
});

// @desc    Get a single public user profile by id (doctor or patient)
// @route   GET /api/users/:id
// @access  Private
const getUserById = catchAsync(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw new ApiError(404, "User not found");
  res.status(200).json({ success: true, user });
});

module.exports = { updateMe, uploadAvatar, getUserById };

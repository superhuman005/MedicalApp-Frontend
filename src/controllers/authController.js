const User = require("../models/User");
const Subscription = require("../models/Subscription");
const FamilyMember = require("../models/FamilyMember");
const catchAsync = require("../utils/catchAsync");
const ApiError = require("../utils/ApiError");
const generateToken = require("../utils/generateToken");
const emailService = require("../services/emailService");
const { notify, notifyMany } = require("../utils/notify");

const sanitizeUser = (user) => {
  const obj = user.toObject ? user.toObject() : user;
  delete obj.password;
  return obj;
};

// @desc    Register a new patient. Doctor accounts are not self-registrable -
//          an admin creates them directly via POST /api/admin/doctors (see
//          adminController.createDoctor), so they start out already approved
//          and vetted instead of going through this public endpoint.
// @route   POST /api/auth/register
// @access  Public
const register = catchAsync(async (req, res) => {
  const { firstName, lastName, email, phone, password } = req.body;

  if (!firstName || !lastName || !email || !password) {
    throw new ApiError(400, "firstName, lastName, email and password are required");
  }

  if (req.body.role && req.body.role !== "patient") {
    throw new ApiError(
      400,
      "Only patient accounts can be created here. Doctor accounts are created by an admin."
    );
  }

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    throw new ApiError(409, "An account with this email already exists");
  }

  const user = await User.create({
    firstName,
    lastName,
    email,
    phone,
    password,
    role: "patient",
    doctorApprovalStatus: "approved",
  });

  await Subscription.create({ patient: user._id, plan: "free" });
  await FamilyMember.create({
    owner: user._id,
    name: `${user.firstName} ${user.lastName} (You)`,
    relationship: "self",
    isSelf: true,
  });

  // Best-effort - a slow/broken mail server should never block signup.
  emailService.sendWelcomeEmail(user.email, { name: user.firstName }).catch((err) => {
    console.error("[register] Welcome email failed:", err.message);
  });

  const token = generateToken(user._id, user.role);

  res.status(201).json({
    success: true,
    token,
    user: sanitizeUser(user),
  });
});

// @desc    Register a new doctor. This is a separate, unlisted endpoint - it
//          is not linked from anywhere in the public frontend (doctors are
//          normally created by an admin, already approved). A doctor who
//          signs up here starts "pending" and goes through the same
//          approval queue as before, exactly like the old public doctor
//          signup used to.
// @route   POST /api/auth/doctor-register
// @access  Public (unlisted)
const doctorRegister = catchAsync(async (req, res) => {
  const { firstName, lastName, email, phone, password, specialization, medicalLicenseNumber, yearsOfExperience, bio } =
    req.body;

  if (!firstName || !lastName || !email || !password) {
    throw new ApiError(400, "firstName, lastName, email and password are required");
  }
  if (!specialization || !medicalLicenseNumber) {
    throw new ApiError(400, "specialization and medicalLicenseNumber are required");
  }
  const experience = Number(yearsOfExperience);
  if (!Number.isFinite(experience) || experience < 0) {
    throw new ApiError(400, "yearsOfExperience must be a non-negative number");
  }

  const existingEmail = await User.findOne({ email: String(email).toLowerCase() });
  if (existingEmail) {
    throw new ApiError(409, "An account with this email already exists");
  }
  const existingLicense = await User.findOne({ medicalLicenseNumber: String(medicalLicenseNumber).trim() });
  if (existingLicense) {
    throw new ApiError(409, "A doctor with this medical license number already exists");
  }

  const doctor = await User.create({
    firstName,
    lastName,
    email,
    phone,
    password,
    role: "doctor",
    specialization,
    medicalLicenseNumber: String(medicalLicenseNumber).trim(),
    yearsOfExperience: experience,
    bio,
    status: "offline",
    doctorApprovalStatus: "pending",
  });

  emailService.sendDoctorApplicationReceived(doctor.email, { name: doctor.lastName }).catch((err) => {
    console.error("[doctorRegister] Applicant email failed:", err.message);
  });

  // Let admins know a new application is waiting on them.
  const admins = await User.find({ role: { $in: ["admin", "superadmin"] }, isActive: true });
  notifyMany(admins, {
    io: req.app.get("io"),
    title: "New doctor application",
    message: `Dr. ${doctor.firstName} ${doctor.lastName} (${doctor.specialization}) applied and is awaiting approval.`,
    type: "account",
    relatedId: doctor._id,
    emailTemplate: "sendGenericNotification",
    emailData: (admin) => ({
      title: "New Doctor Application",
      name: admin.firstName,
      message: `Dr. ${doctor.firstName} ${doctor.lastName} (${doctor.specialization}, license ${doctor.medicalLicenseNumber}) applied to join as a doctor and is awaiting your review.`,
      ctaLabel: "Review Application",
      ctaUrl: process.env.FRONTEND_URL ? `${process.env.FRONTEND_URL}/admin-dashboard` : undefined,
    }),
  }).catch((err) => console.error("[doctorRegister] Admin notify failed:", err.message));

  const token = generateToken(doctor._id, doctor.role);

  res.status(201).json({
    success: true,
    token,
    user: sanitizeUser(doctor),
  });
});

// @desc    Login patient or doctor
// @route   POST /api/auth/login
// @access  Public
const login = catchAsync(async (req, res) => {
  const { email, password, role } = req.body;

  if (!email || !password) {
    throw new ApiError(400, "Email and password are required");
  }

  const user = await User.findOne({ email: email.toLowerCase() }).select("+password");
  if (!user || !(await user.comparePassword(password))) {
    throw new ApiError(401, "Invalid credentials");
  }

  // If the client specified which portal they're logging in through, enforce it
  if (role && user.role !== role) {
    throw new ApiError(401, `No ${role} account found with these credentials`);
  }

  if (!user.isActive) {
    throw new ApiError(403, "This account has been deactivated. Contact support.");
  }

  user.lastLogin = new Date();
  if (user.role === "doctor" && user.doctorApprovalStatus === "approved") {
    user.status = "online";
  }
  await user.save({ validateBeforeSave: false });

  const token = generateToken(user._id, user.role);

  res.status(200).json({
    success: true,
    token,
    user: sanitizeUser(user),
  });
});

// @desc    Get currently logged in user
// @route   GET /api/auth/me
// @access  Private
const getMe = catchAsync(async (req, res) => {
  res.status(200).json({ success: true, user: sanitizeUser(req.user) });
});

// @desc    Log out (client should discard the token; if a cookie was used, clear it)
// @route   POST /api/auth/logout
// @access  Private
const logout = catchAsync(async (req, res) => {
  if (req.user.role === "doctor") {
    req.user.status = "offline";
    await req.user.save({ validateBeforeSave: false });
  }
  res.clearCookie("token");
  res.status(200).json({ success: true, message: "Logged out successfully" });
});

// @desc    Change password while logged in
// @route   PATCH /api/auth/update-password
// @access  Private
const updatePassword = catchAsync(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    throw new ApiError(400, "currentPassword and newPassword are required");
  }
  if (newPassword.length < 6) {
    throw new ApiError(400, "newPassword must be at least 6 characters");
  }

  const user = await User.findById(req.user._id).select("+password");
  if (!(await user.comparePassword(currentPassword))) {
    throw new ApiError(401, "Current password is incorrect");
  }

  user.password = newPassword;
  await user.save();

  notify({
    io: req.app.get("io"),
    user,
    title: "Password changed",
    message: "Your password was updated successfully.",
    type: "account",
    email: { template: "sendPasswordChangedAlert", data: { name: user.firstName } },
  }).catch((err) => console.error("[updatePassword] Notify failed:", err.message));

  const token = generateToken(user._id, user.role);
  res.status(200).json({ success: true, token, message: "Password updated successfully" });
});

module.exports = { register, doctorRegister, login, getMe, logout, updatePassword };

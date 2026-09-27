const User = require("../models/User");
const Appointment = require("../models/Appointment");
const ConsultationRequest = require("../models/ConsultationRequest");
const Subscription = require("../models/Subscription");
const Payment = require("../models/Payment");
const DoctorReport = require("../models/DoctorReport");
const Prescription = require("../models/Prescription");
const crypto = require("crypto");
const catchAsync = require("../utils/catchAsync");
const ApiError = require("../utils/ApiError");
const emailService = require("../services/emailService");
const { notify, notifyMany } = require("../utils/notify");
const { populateOpts: reportPopulateOpts } = require("./doctorReportController");

// @desc    Platform-wide overview stats for the admin dashboard
// @route   GET /api/admin/overview
// @access  Private (admin)
const getOverview = catchAsync(async (req, res) => {
  const [
    totalPatients,
    totalDoctors,
    pendingDoctors,
    totalAppointments,
    appointmentsToday,
    totalConsultationRequests,
    openReports,
    pendingPrescriptions,
    planBreakdown,
    revenueAgg,
  ] = await Promise.all([
    User.countDocuments({ role: "patient" }),
    User.countDocuments({ role: "doctor" }),
    User.countDocuments({ role: "doctor", doctorApprovalStatus: "pending" }),
    Appointment.countDocuments({}),
    Appointment.countDocuments({ date: { $gte: new Date(new Date().toDateString()) } }),
    ConsultationRequest.countDocuments({}),
    DoctorReport.countDocuments({ status: "open" }),
    Prescription.countDocuments({ adminStatus: "pending" }),
    Subscription.aggregate([{ $group: { _id: "$plan", count: { $sum: 1 } } }]),
    Payment.aggregate([
      { $match: { status: "success" } },
      { $group: { _id: null, total: { $sum: "$amount" }, count: { $sum: 1 } } },
    ]),
  ]);

  res.status(200).json({
    success: true,
    overview: {
      totalPatients,
      totalDoctors,
      pendingDoctors,
      totalAppointments,
      appointmentsToday,
      totalConsultationRequests,
      openReports,
      pendingPrescriptions,
      planBreakdown: planBreakdown.map((p) => ({ plan: p._id, count: p.count })),
      revenue: revenueAgg[0]?.total || 0,
      successfulPayments: revenueAgg[0]?.count || 0,
    },
  });
});

// @desc    List users (filter by role)
// @route   GET /api/admin/users?role=&search=
// @access  Private (admin)
const getUsers = catchAsync(async (req, res) => {
  const { role, search } = req.query;
  const filter = {};
  if (role) filter.role = role;
  if (search) {
    filter.$or = [
      { firstName: new RegExp(search, "i") },
      { lastName: new RegExp(search, "i") },
      { email: new RegExp(search, "i") },
    ];
  }
  const users = await User.find(filter).sort({ createdAt: -1 }).limit(200);
  res.status(200).json({ success: true, count: users.length, users });
});

// @desc    List doctors awaiting approval
// @route   GET /api/admin/doctors/pending
// @access  Private (admin)
const getPendingDoctors = catchAsync(async (req, res) => {
  const doctors = await User.find({ role: "doctor", doctorApprovalStatus: "pending" }).sort({ createdAt: 1 });
  res.status(200).json({ success: true, count: doctors.length, doctors });
});

// @desc    List all doctors with their approval status
// @route   GET /api/admin/doctors
// @access  Private (admin)
const getAllDoctors = catchAsync(async (req, res) => {
  const { status } = req.query;
  const filter = { role: "doctor" };
  if (status) filter.doctorApprovalStatus = status;
  const doctors = await User.find(filter).sort({ createdAt: -1 });
  res.status(200).json({ success: true, count: doctors.length, doctors });
});

// @desc    Approve a doctor so they can go online and appear to patients
// @route   PATCH /api/admin/doctors/:id/approve
// @access  Private (admin)
const approveDoctor = catchAsync(async (req, res) => {
  const doctor = await User.findOne({ _id: req.params.id, role: "doctor" });
  if (!doctor) throw new ApiError(404, "Doctor not found");

  doctor.doctorApprovalStatus = "approved";
  doctor.approvalNote = undefined;
  await doctor.save({ validateBeforeSave: false });

  notify({
    io: req.app.get("io"),
    user: doctor,
    title: "You're approved!",
    message: "Your doctor account has been approved. You can now go online and accept patients.",
    type: "account",
    email: { template: "sendDoctorApproved", data: { name: doctor.lastName } },
  }).catch((err) => console.error("[approveDoctor] Notify failed:", err.message));

  res.status(200).json({ success: true, doctor });
});

// @desc    Reject a doctor's application
// @route   PATCH /api/admin/doctors/:id/reject
// @access  Private (admin)
const rejectDoctor = catchAsync(async (req, res) => {
  const doctor = await User.findOne({ _id: req.params.id, role: "doctor" });
  if (!doctor) throw new ApiError(404, "Doctor not found");

  doctor.doctorApprovalStatus = "rejected";
  doctor.approvalNote = req.body.note || undefined;
  doctor.status = "offline";
  await doctor.save({ validateBeforeSave: false });

  notify({
    io: req.app.get("io"),
    user: doctor,
    title: "Application update",
    message: doctor.approvalNote
      ? `Your doctor application wasn't approved. Note: ${doctor.approvalNote}`
      : "Your doctor application wasn't approved.",
    type: "account",
    email: { template: "sendDoctorRejected", data: { name: doctor.lastName, note: doctor.approvalNote } },
  }).catch((err) => console.error("[rejectDoctor] Notify failed:", err.message));

  res.status(200).json({ success: true, doctor });
});

// @desc    List all appointments platform-wide
// @route   GET /api/admin/appointments?status=
// @access  Private (admin)
const getAllAppointments = catchAsync(async (req, res) => {
  const filter = {};
  if (req.query.status) filter.status = req.query.status;

  const appointments = await Appointment.find(filter)
    .select("-questionnaire")
    .populate("doctor", "firstName lastName specialization")
    .populate("patient", "firstName lastName email")
    .populate("familyMember", "name relationship")
    .sort({ date: -1 })
    .limit(200);

  res.status(200).json({ success: true, count: appointments.length, appointments });
});

// @desc    List doctor recommendations/reports for admin review
// @route   GET /api/admin/doctor-reports?status=
// @access  Private (admin)
const getDoctorReports = catchAsync(async (req, res) => {
  const filter = {};
  if (req.query.status) filter.status = req.query.status;

  const reports = await DoctorReport.find(filter).populate(reportPopulateOpts).sort({ createdAt: -1 });
  res.status(200).json({ success: true, count: reports.length, reports });
});

// @desc    Mark a doctor report as reviewed
// @route   PATCH /api/admin/doctor-reports/:id/review
// @access  Private (admin)
const markReportReviewed = catchAsync(async (req, res) => {
  const report = await DoctorReport.findById(req.params.id);
  if (!report) throw new ApiError(404, "Report not found");

  report.status = "reviewed";
  report.reviewedBy = req.user._id;
  report.reviewedAt = new Date();
  await report.save();

  const populated = await report.populate(reportPopulateOpts);
  res.status(200).json({ success: true, report: populated });
});

// @desc    List all payments platform-wide
// @route   GET /api/admin/payments
// @access  Private (admin)
const getAllPayments = catchAsync(async (req, res) => {
  const payments = await Payment.find({})
    .populate("patient", "firstName lastName email")
    .sort({ createdAt: -1 })
    .limit(200);
  res.status(200).json({ success: true, count: payments.length, payments });
});

const prescriptionPopulateOpts = [
  { path: "patient", select: "firstName lastName email phone" },
  { path: "familyMember", select: "name relationship age" },
  { path: "prescribedBy", select: "firstName lastName specialization" },
  { path: "handledBy", select: "firstName lastName" },
];

// @desc    List prescriptions doctors have sent to the admin team
// @route   GET /api/admin/prescriptions?status=pending|fulfilled|rejected
// @access  Private (admin)
const getAdminPrescriptions = catchAsync(async (req, res) => {
  const { status } = req.query;
  const filter = { adminStatus: { $ne: "none" } };
  if (status) {
    if (!["pending", "fulfilled", "rejected"].includes(status)) {
      throw new ApiError(400, "status must be one of: pending, fulfilled, rejected");
    }
    filter.adminStatus = status;
  }

  const prescriptions = await Prescription.find(filter)
    .populate(prescriptionPopulateOpts)
    .sort({ sentToAdminAt: -1 })
    .limit(200);

  res.status(200).json({ success: true, count: prescriptions.length, prescriptions });
});

// @desc    Mark a prescription sent to admin as fulfilled or rejected
// @route   PATCH /api/admin/prescriptions/:id/status   body: { status, note? }
// @access  Private (admin)
const updateAdminPrescriptionStatus = catchAsync(async (req, res) => {
  const { status, note } = req.body;
  if (!["fulfilled", "rejected"].includes(status)) {
    throw new ApiError(400, "status must be 'fulfilled' or 'rejected'");
  }
  if (status === "rejected" && !(note && String(note).trim())) {
    throw new ApiError(400, "Please add a note explaining why the prescription was rejected");
  }

  const prescription = await Prescription.findById(req.params.id);
  if (!prescription || prescription.adminStatus === "none") {
    throw new ApiError(404, "Prescription not found in the admin queue");
  }
  if (prescription.adminStatus !== "pending") {
    throw new ApiError(400, `This prescription was already ${prescription.adminStatus}`);
  }

  prescription.adminStatus = status;
  prescription.adminNote = note ? String(note).trim().slice(0, 500) : undefined;
  prescription.handledBy = req.user._id;
  prescription.handledAt = new Date();
  await prescription.save();

  const label = status === "fulfilled" ? "processed" : "declined";
  const populated = await prescription.populate(prescriptionPopulateOpts);
  const io = req.app.get("io");

  notify({
    io,
    user: populated.patient,
    title: `Prescription ${label}`,
    message: `Your prescription for ${prescription.medication} was ${label} by the admin team.${
      prescription.adminNote ? ` Note: ${prescription.adminNote}` : ""
    }`,
    type: "prescription",
    relatedId: prescription._id,
    email: {
      template: "sendPrescriptionStatusUpdate",
      data: {
        name: `${populated.patient.firstName} ${populated.patient.lastName}`,
        medication: prescription.medication,
        status,
        note: prescription.adminNote,
      },
    },
  }).catch((err) => console.error("[updateAdminPrescriptionStatus] Patient notify failed:", err.message));

  if (status === "rejected") {
    // The prescribing doctor needs to know so they can follow up
    notify({
      io,
      user: populated.prescribedBy,
      title: "Prescription declined by admin",
      message: `Your prescription for ${prescription.medication} was declined. Note: ${prescription.adminNote}`,
      type: "prescription",
      relatedId: prescription._id,
      email: {
        template: "sendPrescriptionStatusUpdate",
        data: {
          name: `${populated.prescribedBy.firstName} ${populated.prescribedBy.lastName}`,
          medication: prescription.medication,
          status,
          note: prescription.adminNote,
        },
      },
    }).catch((err) => console.error("[updateAdminPrescriptionStatus] Doctor notify failed:", err.message));
  }

  res.status(200).json({ success: true, prescription: populated });
});

// @desc    List admin accounts
// @route   GET /api/admin/admins
// @access  Private (admin)
const getAdmins = catchAsync(async (req, res) => {
  const admins = await User.find({ role: { $in: ["admin", "superadmin"] } }).sort({ createdAt: 1 });
  res.status(200).json({ success: true, count: admins.length, admins });
});

// @desc    Create a doctor account directly. This is the only way doctor
//          accounts get created now - there is no public doctor signup.
//          Because an admin is vetting the doctor up front, the account is
//          created already approved (skips the pending-approval queue).
// @route   POST /api/admin/doctors
//          body: { firstName, lastName, email, phone?, password?, specialization,
//                  medicalLicenseNumber, yearsOfExperience, bio?, consultationFee? }
// @access  Private (admin)
const createDoctor = catchAsync(async (req, res) => {
  const {
    firstName,
    lastName,
    email,
    phone,
    specialization,
    medicalLicenseNumber,
    yearsOfExperience,
    bio,
    consultationFee,
  } = req.body;
  let { password } = req.body;

  if (!firstName || !lastName || !email) {
    throw new ApiError(400, "firstName, lastName and email are required");
  }
  if (!/^\S+@\S+\.\S+$/.test(email)) {
    throw new ApiError(400, "Please provide a valid email");
  }
  if (!specialization || !medicalLicenseNumber) {
    throw new ApiError(400, "specialization and medicalLicenseNumber are required");
  }
  const experience = Number(yearsOfExperience);
  if (!Number.isFinite(experience) || experience < 0) {
    throw new ApiError(400, "yearsOfExperience must be a non-negative number");
  }
  if (password !== undefined && password !== "" && String(password).length < 8) {
    throw new ApiError(400, "Password must be at least 8 characters");
  }

  const existingEmail = await User.findOne({ email: String(email).toLowerCase() });
  if (existingEmail) {
    throw new ApiError(409, "An account with this email already exists");
  }
  const existingLicense = await User.findOne({ medicalLicenseNumber: String(medicalLicenseNumber).trim() });
  if (existingLicense) {
    throw new ApiError(409, "A doctor with this medical license number already exists");
  }

  let generatedPassword;
  if (!password) {
    generatedPassword = crypto.randomBytes(9).toString("base64url");
    password = generatedPassword;
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
    consultationFee: {
      video: Number(consultationFee?.video) || undefined,
      chat: Number(consultationFee?.chat) || undefined,
    },
    status: "offline",
    // Admin-created doctors are already vetted, so they skip the pending queue.
    doctorApprovalStatus: "approved",
  });

  const safe = doctor.toObject();
  delete safe.password;

  emailService
    .sendAccountCredentials(doctor.email, { name: doctor.firstName, role: "doctor", temporaryPassword: generatedPassword })
    .catch((err) => console.error("[createDoctor] Credentials email failed:", err.message));

  res.status(201).json({
    success: true,
    doctor: safe,
    ...(generatedPassword ? { temporaryPassword: generatedPassword } : {}),
  });
});

// @desc    Create another admin account. Any admin can do this; the new
//          account always gets the plain "admin" role (super admins are only
//          created out-of-band via the seed script).
// @route   POST /api/admin/admins   body: { firstName, lastName, email, phone?, password? }
// @access  Private (admin)
const createAdmin = catchAsync(async (req, res) => {
  const { firstName, lastName, email, phone } = req.body;
  let { password } = req.body;

  if (!firstName || !lastName || !email) {
    throw new ApiError(400, "firstName, lastName and email are required");
  }
  if (!/^\S+@\S+\.\S+$/.test(email)) {
    throw new ApiError(400, "Please provide a valid email");
  }
  if (password !== undefined && password !== "" && String(password).length < 8) {
    throw new ApiError(400, "Password must be at least 8 characters");
  }

  const existing = await User.findOne({ email: String(email).toLowerCase() });
  if (existing) {
    throw new ApiError(409, "An account with this email already exists");
  }

  // If no password was supplied, generate a strong temporary one and return it
  // once so the creating admin can pass it on securely.
  let generatedPassword;
  if (!password) {
    generatedPassword = crypto.randomBytes(9).toString("base64url");
    password = generatedPassword;
  }

  const admin = await User.create({
    firstName,
    lastName,
    email,
    phone,
    password,
    role: "admin",
    doctorApprovalStatus: "approved",
  });

  const safe = admin.toObject();
  delete safe.password;

  emailService
    .sendAccountCredentials(admin.email, { name: admin.firstName, role: "admin", temporaryPassword: generatedPassword })
    .catch((err) => console.error("[createAdmin] Credentials email failed:", err.message));

  res.status(201).json({
    success: true,
    admin: safe,
    ...(generatedPassword ? { temporaryPassword: generatedPassword } : {}),
  });
});

module.exports = {
  createDoctor,
  getAdminPrescriptions,
  updateAdminPrescriptionStatus,
  getAdmins,
  createAdmin,
  getOverview,
  getUsers,
  getPendingDoctors,
  getAllDoctors,
  approveDoctor,
  rejectDoctor,
  getAllAppointments,
  getDoctorReports,
  markReportReviewed,
  getAllPayments,
};

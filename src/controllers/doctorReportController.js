const DoctorReport = require("../models/DoctorReport");
const Appointment = require("../models/Appointment");
const User = require("../models/User");
const catchAsync = require("../utils/catchAsync");
const ApiError = require("../utils/ApiError");
const { notifyMany } = require("../utils/notify");

const populateOpts = [
  { path: "doctor", select: "firstName lastName specialization avatar" },
  { path: "patient", select: "firstName lastName email" },
  { path: "familyMember", select: "name relationship" },
  { path: "appointment", select: "date time type appointmentType status" },
  { path: "reviewedBy", select: "firstName lastName" },
];

// @desc    Doctor submits a recommendation/report to admin, typically when
//          ending a consultation
// @route   POST /api/doctor-reports
// @access  Private (doctor)
const createReport = catchAsync(async (req, res) => {
  const { appointmentId, recommendation, urgency } = req.body;
  if (!appointmentId || !recommendation) {
    throw new ApiError(400, "appointmentId and recommendation are required");
  }

  const appointment = await Appointment.findById(appointmentId);
  if (!appointment) throw new ApiError(404, "Appointment not found");
  if (!appointment.doctor.equals(req.user._id)) {
    throw new ApiError(403, "You can only report on your own appointments");
  }

  const report = await DoctorReport.create({
    doctor: req.user._id,
    patient: appointment.patient,
    familyMember: appointment.familyMember || undefined,
    appointment: appointment._id,
    recommendation,
    urgency: urgency || "low",
  });

  const populated = await report.populate(populateOpts);

  const admins = await User.find({ role: { $in: ["admin", "superadmin"] }, isActive: true });
  notifyMany(admins, {
    io: req.app.get("io"),
    title: "New doctor recommendation",
    message: `Dr. ${req.user.lastName} sent a ${report.urgency}-priority recommendation for review.`,
    type: "system",
    relatedId: report._id,
    emailTemplate: "sendGenericNotification",
    emailData: (admin) => ({
      title: "New Doctor Recommendation",
      name: admin.firstName,
      message: `Dr. ${req.user.firstName} ${req.user.lastName} submitted a ${report.urgency}-priority recommendation after a consultation.`,
      ctaLabel: "Review Recommendation",
      ctaUrl: process.env.FRONTEND_URL ? `${process.env.FRONTEND_URL}/admin-dashboard` : undefined,
    }),
  }).catch((err) => console.error("[createReport] Notify failed:", err.message));

  res.status(201).json({ success: true, report: populated });
});

// @desc    List the logged-in doctor's own submitted reports
// @route   GET /api/doctor-reports/mine
// @access  Private (doctor)
const getMyReports = catchAsync(async (req, res) => {
  const reports = await DoctorReport.find({ doctor: req.user._id })
    .populate(populateOpts)
    .sort({ createdAt: -1 });
  res.status(200).json({ success: true, count: reports.length, reports });
});

module.exports = { createReport, getMyReports, populateOpts };

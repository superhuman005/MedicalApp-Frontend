const Appointment = require("../models/Appointment");
const User = require("../models/User");
const FamilyMember = require("../models/FamilyMember");
const catchAsync = require("../utils/catchAsync");
const ApiError = require("../utils/ApiError");
const { parseQuestionnaire } = require("../utils/questionnaire");
const { notify } = require("../utils/notify");

const populateOpts = [
  { path: "doctor", select: "firstName lastName specialization avatar rating status" },
  { path: "patient", select: "firstName lastName avatar" },
  { path: "familyMember", select: "name relationship age avatar" },
];

// @desc    Book an appointment with a doctor
// @route   POST /api/appointments
// @access  Private (patient)
const bookAppointment = catchAsync(async (req, res) => {
  const { doctorId, familyMemberId, date, time, type, appointmentType, reason, questionnaire } = req.body;

  if (!doctorId || !date || !time || !type) {
    throw new ApiError(400, "doctorId, date, time and type are required");
  }
  if (!["video", "chat"].includes(type)) {
    throw new ApiError(400, "type must be 'video' or 'chat'");
  }

  // Patients must complete the health questionnaire before booking
  const cleanQuestionnaire = parseQuestionnaire(questionnaire);

  const doctor = await User.findOne({ _id: doctorId, role: "doctor", doctorApprovalStatus: "approved" });
  if (!doctor) throw new ApiError(404, "Doctor not found");

  if (familyMemberId) {
    const member = await FamilyMember.findOne({ _id: familyMemberId, owner: req.user._id });
    if (!member) throw new ApiError(404, "Patient profile not found");
  }

  const fee = type === "video" ? doctor.consultationFee?.video : doctor.consultationFee?.chat;

  const appointment = await Appointment.create({
    patient: req.user._id,
    familyMember: familyMemberId || undefined,
    doctor: doctorId,
    date,
    time,
    type,
    appointmentType: appointmentType || "Initial Consultation",
    reason: reason || cleanQuestionnaire.chiefComplaint,
    questionnaire: cleanQuestionnaire,
    consultationFee: fee || 0,
    status: "pending",
  });

  const populated = await appointment.populate(populateOpts);
  const io = req.app.get("io");
  io?.to(`user:${doctorId}`).emit("appointment:new", populated);

  notify({
    io,
    user: doctor,
    title: "New Appointment Request",
    message: `${req.user.firstName} ${req.user.lastName} booked a ${type} appointment for ${date} at ${time}`,
    type: "appointment",
    relatedId: appointment._id,
    email: {
      template: "sendNewBookingRequest",
      data: {
        doctorName: doctor.lastName,
        patientName: `${req.user.firstName} ${req.user.lastName}`,
        date,
        time,
        type,
        reason: appointment.reason,
      },
    },
  }).catch((err) => console.error("[bookAppointment] Notify failed:", err.message));

  res.status(201).json({ success: true, appointment: populated });
});

// @desc    List appointments belonging to the logged-in user (patient or doctor)
// @route   GET /api/appointments?status=&upcoming=true
// @access  Private
const getMyAppointments = catchAsync(async (req, res) => {
  const filter = req.user.role === "doctor" ? { doctor: req.user._id } : { patient: req.user._id };

  if (req.query.status) filter.status = req.query.status;
  if (req.query.upcoming === "true") filter.date = { $gte: new Date(new Date().toDateString()) };

  const appointments = await Appointment.find(filter)
    .populate(populateOpts)
    .sort({ date: 1 });

  res.status(200).json({ success: true, count: appointments.length, appointments });
});

// @desc    Get single appointment
// @route   GET /api/appointments/:id
// @access  Private (participant only)
const getAppointmentById = catchAsync(async (req, res) => {
  const appointment = await Appointment.findById(req.params.id).populate(populateOpts);
  if (!appointment) throw new ApiError(404, "Appointment not found");

  const isParticipant =
    appointment.patient._id.equals(req.user._id) || appointment.doctor._id.equals(req.user._id);
  if (!isParticipant && req.user.role !== "admin") {
    throw new ApiError(403, "You do not have access to this appointment");
  }

  res.status(200).json({ success: true, appointment });
});

// @desc    Update appointment status (confirm, start, complete, mark waiting)
// @route   PATCH /api/appointments/:id/status
// @access  Private (doctor or patient participant)
const updateAppointmentStatus = catchAsync(async (req, res) => {
  const { status } = req.body;
  const allowed = ["pending", "confirmed", "waiting", "in-progress", "completed", "cancelled"];
  if (!allowed.includes(status)) {
    throw new ApiError(400, `status must be one of: ${allowed.join(", ")}`);
  }

  const appointment = await Appointment.findById(req.params.id);
  if (!appointment) throw new ApiError(404, "Appointment not found");

  const isParticipant =
    appointment.patient.equals(req.user._id) || appointment.doctor.equals(req.user._id);
  if (!isParticipant) throw new ApiError(403, "You do not have access to this appointment");

  const previousStatus = appointment.status;
  appointment.status = status;
  await appointment.save();

  const populated = await appointment.populate(populateOpts);
  const io = req.app.get("io");
  io?.to(`appointment:${appointment._id}`).emit("appointment:updated", populated);

  // Patient-facing: let them know as soon as the doctor confirms their booking request.
  if (status === "confirmed" && previousStatus !== "confirmed" && req.user.role === "doctor") {
    notify({
      io,
      user: populated.patient,
      title: "Appointment Confirmed",
      message: `Dr. ${populated.doctor.lastName} confirmed your ${populated.type} appointment on ${new Date(
        populated.date
      ).toLocaleDateString()} at ${populated.time}.`,
      type: "appointment",
      relatedId: appointment._id,
      email: {
        template: "sendAppointmentConfirmation",
        data: {
          patientName: `${populated.patient.firstName} ${populated.patient.lastName}`,
          doctorName: populated.doctor.lastName,
          date: new Date(populated.date).toLocaleDateString(),
          time: populated.time,
          type: populated.type,
        },
      },
    }).catch((err) => console.error("[updateAppointmentStatus] Notify failed:", err.message));
  }

  res.status(200).json({ success: true, appointment: populated });
});

// @desc    Cancel an appointment
// @route   DELETE /api/appointments/:id
// @access  Private (participant)
const cancelAppointment = catchAsync(async (req, res) => {
  const appointment = await Appointment.findById(req.params.id);
  if (!appointment) throw new ApiError(404, "Appointment not found");

  const isParticipant =
    appointment.patient.equals(req.user._id) || appointment.doctor.equals(req.user._id);
  if (!isParticipant) throw new ApiError(403, "You do not have access to this appointment");

  appointment.status = "cancelled";
  appointment.cancelledBy = req.user._id;
  appointment.cancellationReason = req.body.reason;
  await appointment.save();

  const populated = await appointment.populate(populateOpts);
  const isPatientCancelling = populated.patient._id.equals(req.user._id);
  const otherParty = isPatientCancelling ? populated.doctor : populated.patient;
  const cancelledByName = isPatientCancelling
    ? `${populated.patient.firstName} ${populated.patient.lastName}`
    : `Dr. ${populated.doctor.lastName}`;

  notify({
    io: req.app.get("io"),
    user: otherParty,
    title: "Appointment Cancelled",
    message: `Your ${populated.type} appointment on ${new Date(populated.date).toLocaleDateString()} at ${
      populated.time
    } was cancelled by ${cancelledByName}.${req.body.reason ? ` Reason: ${req.body.reason}` : ""}`,
    type: "appointment",
    relatedId: appointment._id,
    email: {
      template: "sendAppointmentCancelled",
      data: {
        doctorName: populated.doctor.lastName,
        patientName: `${populated.patient.firstName} ${populated.patient.lastName}`,
        date: new Date(populated.date).toLocaleDateString(),
        time: populated.time,
        cancelledByName,
        reason: req.body.reason || "No reason given",
      },
    },
  }).catch((err) => console.error("[cancelAppointment] Notify failed:", err.message));

  res.status(200).json({ success: true, message: "Appointment cancelled", appointment: populated });
});

module.exports = {
  bookAppointment,
  getMyAppointments,
  getAppointmentById,
  updateAppointmentStatus,
  cancelAppointment,
};

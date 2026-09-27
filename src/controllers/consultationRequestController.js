const ConsultationRequest = require("../models/ConsultationRequest");
const Appointment = require("../models/Appointment");
const FamilyMember = require("../models/FamilyMember");
const User = require("../models/User");
const catchAsync = require("../utils/catchAsync");
const ApiError = require("../utils/ApiError");
const { parseQuestionnaire } = require("../utils/questionnaire");
const { notify } = require("../utils/notify");

const populateOpts = [
  { path: "patient", select: "firstName lastName avatar" },
  { path: "familyMember", select: "name relationship age avatar" },
  { path: "doctor", select: "firstName lastName specialization avatar" },
  { path: "acceptedBy", select: "firstName lastName specialization avatar" },
];

// @desc    Patient sends an immediate consultation request (broadcast to available doctors,
//          or targeted at a specific doctor if doctorId is provided)
// @route   POST /api/consultation-requests
// @access  Private (patient)
const createRequest = catchAsync(async (req, res) => {
  const { familyMemberId, doctorId, type, urgency, message, questionnaire } = req.body;

  if (!type || !["video", "chat"].includes(type)) {
    throw new ApiError(400, "type must be 'video' or 'chat'");
  }

  // Patients must complete the health questionnaire before a doctor sees the request
  const cleanQuestionnaire = parseQuestionnaire(questionnaire);

  if (familyMemberId) {
    const member = await FamilyMember.findOne({ _id: familyMemberId, owner: req.user._id });
    if (!member) throw new ApiError(404, "Patient profile not found");
  }

  let targetDoctor;
  if (doctorId) {
    targetDoctor = await User.findOne({ _id: doctorId, role: "doctor", doctorApprovalStatus: "approved" });
    if (!targetDoctor) throw new ApiError(404, "Doctor not found");
  }

  const request = await ConsultationRequest.create({
    patient: req.user._id,
    familyMember: familyMemberId || undefined,
    doctor: doctorId || null,
    type,
    urgency: urgency || "medium",
    message,
    questionnaire: cleanQuestionnaire,
  });

  const populated = await request.populate(populateOpts);

  const io = req.app.get("io");
  if (io) {
    if (doctorId) {
      io.to(`user:${doctorId}`).emit("consultation-request:new", populated);
    } else {
      // Broadcast to all connected doctors
      io.to("role:doctor").emit("consultation-request:new", populated);
    }
  }

  // Only email/notify for requests targeted at one doctor - a broadcast email
  // to every available doctor would be spammy, and the socket broadcast above
  // already reaches whoever's online.
  if (targetDoctor) {
    notify({
      io,
      user: targetDoctor,
      title: "New Consultation Request",
      message: `${req.user.firstName} ${req.user.lastName} is requesting a ${urgency || "medium"}-priority ${type} consultation.`,
      type: "consultation-request",
      relatedId: request._id,
      email: {
        template: "sendConsultationRequestReceived",
        data: {
          doctorName: targetDoctor.lastName,
          patientName: `${req.user.firstName} ${req.user.lastName}`,
          type,
          urgency: urgency || "medium",
        },
      },
    }).catch((err) => console.error("[createRequest] Notify failed:", err.message));
  }

  res.status(201).json({ success: true, request: populated });
});

// @desc    List consultation requests. Doctors see pending broadcast + requests aimed at them;
//          patients see their own requests.
// @route   GET /api/consultation-requests?status=
// @access  Private
const getRequests = catchAsync(async (req, res) => {
  let filter;
  if (req.user.role === "doctor") {
    filter = {
      $or: [{ doctor: req.user._id }, { doctor: null }],
    };
    if (req.query.status) filter.status = req.query.status;
    else filter.status = "pending"; // default view for doctors: actionable requests
  } else {
    filter = { patient: req.user._id };
    if (req.query.status) filter.status = req.query.status;
  }

  const requests = await ConsultationRequest.find(filter)
    .populate(populateOpts)
    .sort({ createdAt: -1 });

  res.status(200).json({ success: true, count: requests.length, requests });
});

// @desc    Doctor accepts a request -> creates a confirmed appointment for "now"
// @route   PATCH /api/consultation-requests/:id/accept
// @access  Private (doctor)
const acceptRequest = catchAsync(async (req, res) => {
  if (req.user.doctorApprovalStatus !== "approved") {
    throw new ApiError(403, "Your account is awaiting admin approval and can't accept consultations yet");
  }

  const request = await ConsultationRequest.findById(req.params.id);
  if (!request) throw new ApiError(404, "Request not found");
  if (request.status !== "pending") throw new ApiError(400, "This request is no longer pending");
  if (request.doctor && !request.doctor.equals(req.user._id)) {
    throw new ApiError(403, "This request was directed to another doctor");
  }

  const now = new Date();
  const appointment = await Appointment.create({
    patient: request.patient,
    familyMember: request.familyMember || undefined,
    doctor: req.user._id,
    date: now,
    time: now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    type: request.type,
    appointmentType: "Initial Consultation",
    reason: request.message || request.questionnaire?.chiefComplaint,
    // Carry the intake questionnaire over so the doctor still has it in the call
    questionnaire: request.questionnaire ? request.questionnaire.toObject() : undefined,
    consultationFee:
      request.type === "video" ? req.user.consultationFee?.video : req.user.consultationFee?.chat,
    status: "confirmed",
  });

  request.status = "accepted";
  request.acceptedBy = req.user._id;
  request.doctor = req.user._id;
  request.respondedAt = now;
  request.appointment = appointment._id;
  await request.save();

  const populated = await request.populate(populateOpts);
  const io = req.app.get("io");
  io?.to(`user:${request.patient}`).emit("consultation-request:accepted", populated);

  notify({
    io,
    user: populated.patient,
    title: "Consultation Request Accepted",
    message: `Dr. ${req.user.lastName} accepted your ${request.type} consultation request`,
    type: "consultation-request",
    relatedId: request._id,
    email: {
      template: "sendAppointmentConfirmation",
      data: {
        patientName: `${populated.patient.firstName} ${populated.patient.lastName}`,
        doctorName: req.user.lastName,
        date: now.toLocaleDateString(),
        time: appointment.time,
        type: request.type,
      },
    },
  }).catch((err) => console.error("[acceptRequest] Notify failed:", err.message));

  res.status(200).json({ success: true, request: populated, appointment });
});

// @desc    Doctor declines a request
// @route   PATCH /api/consultation-requests/:id/decline
// @access  Private (doctor)
const declineRequest = catchAsync(async (req, res) => {
  const request = await ConsultationRequest.findById(req.params.id);
  if (!request) throw new ApiError(404, "Request not found");
  if (request.status !== "pending") throw new ApiError(400, "This request is no longer pending");

  // If it was targeted specifically at this doctor, mark declined.
  // If it was a broadcast request, leave it pending for other doctors unless it targeted this doctor.
  if (request.doctor && request.doctor.equals(req.user._id)) {
    request.status = "declined";
    request.respondedAt = new Date();
    await request.save();

    const populated = await request.populate(populateOpts);
    notify({
      io: req.app.get("io"),
      user: populated.patient,
      title: "Consultation Request Declined",
      message: `Dr. ${req.user.lastName} isn't able to take your ${request.type} consultation request right now.`,
      type: "consultation-request",
      relatedId: request._id,
      email: {
        template: "sendConsultationRequestDeclined",
        data: {
          patientName: `${populated.patient.firstName} ${populated.patient.lastName}`,
          doctorName: req.user.lastName,
          type: request.type,
        },
      },
    }).catch((err) => console.error("[declineRequest] Notify failed:", err.message));
  } else if (!request.doctor) {
    // no-op for broadcast requests declined by an individual doctor; other doctors can still accept
  } else {
    throw new ApiError(403, "This request was directed to another doctor");
  }

  res.status(200).json({ success: true, message: "Request declined" });
});

// @desc    Cancel a pending request (patient)
// @route   PATCH /api/consultation-requests/:id/cancel
// @access  Private (patient - owner)
const cancelRequest = catchAsync(async (req, res) => {
  const request = await ConsultationRequest.findOne({ _id: req.params.id, patient: req.user._id });
  if (!request) throw new ApiError(404, "Request not found");
  if (request.status !== "pending") throw new ApiError(400, "This request can no longer be cancelled");

  request.status = "cancelled";
  await request.save();

  res.status(200).json({ success: true, message: "Request cancelled" });
});

module.exports = { createRequest, getRequests, acceptRequest, declineRequest, cancelRequest };

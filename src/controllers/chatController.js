const ChatMessage = require("../models/ChatMessage");
const Appointment = require("../models/Appointment");
const ConsultationRequest = require("../models/ConsultationRequest");
const catchAsync = require("../utils/catchAsync");
const ApiError = require("../utils/ApiError");

// Verifies the logged-in user is a participant of the given conversation
// (an Appointment or ConsultationRequest) and returns it.
const authorizeConversation = async (conversationId, conversationModel, user) => {
  const Model = conversationModel === "Appointment" ? Appointment : ConsultationRequest;
  const convo = await Model.findById(conversationId);
  if (!convo) throw new ApiError(404, "Conversation not found");

  const patientId = convo.patient?.toString();
  const doctorId = (convo.doctor || convo.acceptedBy)?.toString();
  if (![patientId, doctorId].includes(user._id.toString())) {
    throw new ApiError(403, "You are not a participant in this conversation");
  }
  return convo;
};

// @desc    Get message history for a conversation
// @route   GET /api/chat/:conversationModel/:conversationId/messages
// @access  Private (participant)
const getMessages = catchAsync(async (req, res) => {
  const { conversationId, conversationModel } = req.params;
  if (!["Appointment", "ConsultationRequest"].includes(conversationModel)) {
    throw new ApiError(400, "conversationModel must be 'Appointment' or 'ConsultationRequest'");
  }

  await authorizeConversation(conversationId, conversationModel, req.user);

  const messages = await ChatMessage.find({ conversation: conversationId, conversationModel })
    .populate("sender", "firstName lastName avatar role")
    .sort({ createdAt: 1 });

  // Mark messages sent to me as read
  await ChatMessage.updateMany(
    { conversation: conversationId, sender: { $ne: req.user._id }, status: { $ne: "read" } },
    { status: "read" }
  );

  res.status(200).json({ success: true, count: messages.length, messages });
});

// @desc    Send a chat message (REST fallback; real-time delivery happens over Socket.io)
// @route   POST /api/chat/:conversationModel/:conversationId/messages
// @access  Private (participant)
const sendMessage = catchAsync(async (req, res) => {
  const { conversationId, conversationModel } = req.params;
  const { text, attachmentUrl } = req.body;

  if (!["Appointment", "ConsultationRequest"].includes(conversationModel)) {
    throw new ApiError(400, "conversationModel must be 'Appointment' or 'ConsultationRequest'");
  }
  if (!text && !attachmentUrl) {
    throw new ApiError(400, "text or attachmentUrl is required");
  }

  await authorizeConversation(conversationId, conversationModel, req.user);

  const message = await ChatMessage.create({
    conversation: conversationId,
    conversationModel,
    sender: req.user._id,
    senderRole: req.user.role,
    text,
    attachmentUrl,
  });

  const populated = await message.populate("sender", "firstName lastName avatar role");

  req.app.get("io")?.to(`conversation:${conversationId}`).emit("chat:message", populated);

  res.status(201).json({ success: true, message: populated });
});

module.exports = { getMessages, sendMessage };

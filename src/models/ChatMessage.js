const mongoose = require("mongoose");

const chatMessageSchema = new mongoose.Schema(
  {
    // The chat is grouped by an Appointment or ConsultationRequest id, referred to generically
    // as "conversation" so either can be used as the chat room key.
    conversation: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
    conversationModel: { type: String, enum: ["Appointment", "ConsultationRequest"], required: true },
    sender: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    senderRole: { type: String, enum: ["patient", "doctor"], required: true },
    text: { type: String, trim: true, maxlength: 5000 },
    attachmentUrl: { type: String, trim: true },
    status: { type: String, enum: ["sent", "delivered", "read"], default: "sent" },
  },
  { timestamps: true }
);

chatMessageSchema.index({ conversation: 1, createdAt: 1 });

module.exports = mongoose.model("ChatMessage", chatMessageSchema);

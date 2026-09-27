const mongoose = require("mongoose");
const questionnaireSchema = require("./schemas/questionnaireSchema");

const consultationRequestSchema = new mongoose.Schema(
  {
    patient: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    familyMember: { type: mongoose.Schema.Types.ObjectId, ref: "FamilyMember" },
    // If null, the request is broadcast to all available doctors (matches "Request Care" flow)
    doctor: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    type: { type: String, enum: ["video", "chat"], required: true },
    urgency: { type: String, enum: ["low", "medium", "high"], default: "medium" },
    message: { type: String, trim: true, maxlength: 1000 },
    // Health questionnaire the patient fills in before the request is sent.
    // Doctors read this before accepting.
    questionnaire: { type: questionnaireSchema },
    status: {
      type: String,
      enum: ["pending", "accepted", "declined", "completed", "cancelled"],
      default: "pending",
      index: true,
    },
    acceptedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    respondedAt: { type: Date },
    // Once accepted, an Appointment is created and linked here
    appointment: { type: mongoose.Schema.Types.ObjectId, ref: "Appointment" },
  },
  { timestamps: true }
);

consultationRequestSchema.virtual("timeAgo").get(function () {
  const diffMs = Date.now() - new Date(this.createdAt).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} minute${mins === 1 ? "" : "s"} ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
});

consultationRequestSchema.set("toJSON", { virtuals: true });
consultationRequestSchema.set("toObject", { virtuals: true });

module.exports = mongoose.model("ConsultationRequest", consultationRequestSchema);

const mongoose = require("mongoose");
const questionnaireSchema = require("./schemas/questionnaireSchema");

const appointmentSchema = new mongoose.Schema(
  {
    patient: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    familyMember: { type: mongoose.Schema.Types.ObjectId, ref: "FamilyMember" },
    doctor: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    date: { type: Date, required: true },
    time: { type: String, required: true }, // display string e.g. "10:00 AM"
    type: { type: String, enum: ["video", "chat"], required: true },
    appointmentType: {
      type: String,
      enum: ["Initial Consultation", "Follow-up", "Check-up", "Emergency"],
      default: "Initial Consultation",
    },
    reason: { type: String, trim: true, maxlength: 1000 },
    // Health questionnaire the patient filled in when booking (or copied from
    // the consultation request that created this appointment).
    questionnaire: { type: questionnaireSchema },
    status: {
      type: String,
      enum: ["pending", "confirmed", "waiting", "in-progress", "completed", "cancelled"],
      default: "pending",
    },
    consultationFee: { type: Number, default: 0 },
    cancelledBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    cancellationReason: { type: String, trim: true },
    notes: { type: String, trim: true },
  },
  { timestamps: true }
);

appointmentSchema.index({ doctor: 1, date: 1 });
appointmentSchema.index({ patient: 1, date: 1 });

module.exports = mongoose.model("Appointment", appointmentSchema);

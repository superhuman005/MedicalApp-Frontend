const mongoose = require("mongoose");

// A private note a doctor sends to the admin team when ending a consultation -
// distinct from the patient-facing Consultation record. Lets admins monitor
// clinical/operational concerns (e.g. "this patient needs urgent in-person
// care", "suspected abuse", "platform misuse") across all doctors.
const doctorReportSchema = new mongoose.Schema(
  {
    doctor: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    patient: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    familyMember: { type: mongoose.Schema.Types.ObjectId, ref: "FamilyMember" },
    appointment: { type: mongoose.Schema.Types.ObjectId, ref: "Appointment", required: true },
    recommendation: { type: String, required: true, trim: true, maxlength: 4000 },
    urgency: { type: String, enum: ["low", "medium", "high"], default: "low" },
    status: { type: String, enum: ["open", "reviewed"], default: "open", index: true },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    reviewedAt: { type: Date },
  },
  { timestamps: true }
);

doctorReportSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model("DoctorReport", doctorReportSchema);

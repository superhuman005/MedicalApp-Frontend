const mongoose = require("mongoose");

// Represents a completed visit / medical record entry (distinct from the
// scheduling "Appointment" model above - this is the clinical note left
// behind after a consultation).
const consultationSchema = new mongoose.Schema(
  {
    patient: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    familyMember: { type: mongoose.Schema.Types.ObjectId, ref: "FamilyMember" },
    doctor: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    appointment: { type: mongoose.Schema.Types.ObjectId, ref: "Appointment" },
    date: { type: Date, required: true, default: Date.now },
    specialty: { type: String, trim: true },
    diagnosis: { type: String, trim: true },
    prescription: { type: String, trim: true },
    notes: { type: String, trim: true, maxlength: 4000 },
    status: {
      type: String,
      enum: ["completed", "follow-up-required", "cancelled"],
      default: "completed",
    },
  },
  { timestamps: true }
);

consultationSchema.index({ patient: 1, date: -1 });

module.exports = mongoose.model("Consultation", consultationSchema);

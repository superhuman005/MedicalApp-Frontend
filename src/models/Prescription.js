const mongoose = require("mongoose");

const prescriptionSchema = new mongoose.Schema(
  {
    patient: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    familyMember: { type: mongoose.Schema.Types.ObjectId, ref: "FamilyMember" },
    prescribedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    consultation: { type: mongoose.Schema.Types.ObjectId, ref: "Consultation" },
    medication: { type: String, required: true, trim: true },
    dosage: { type: String, trim: true },
    instructions: { type: String, trim: true },
    date: { type: Date, default: Date.now },
    status: { type: String, enum: ["active", "completed", "expired", "cancelled"], default: "active" },
    refills: { type: Number, default: 0, min: 0 },

    // ---- Hand-off to the admin team ----
    // "none" = kept between doctor and patient only; "pending" = sent to admins
    // and waiting to be handled; then "fulfilled" or "rejected" by an admin.
    adminStatus: { type: String, enum: ["none", "pending", "fulfilled", "rejected"], default: "none", index: true },
    sentToAdminAt: { type: Date },
    adminNote: { type: String, trim: true, maxlength: 500 },
    handledBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    handledAt: { type: Date },
  },
  { timestamps: true }
);

prescriptionSchema.index({ patient: 1, date: -1 });

module.exports = mongoose.model("Prescription", prescriptionSchema);

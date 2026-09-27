const mongoose = require("mongoose");

const vitalSignSchema = new mongoose.Schema(
  {
    patient: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    familyMember: { type: mongoose.Schema.Types.ObjectId, ref: "FamilyMember" },
    recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    date: { type: Date, default: Date.now },
    bloodPressure: { type: String, trim: true }, // e.g. "120/80"
    heartRate: { type: String, trim: true }, // bpm
    temperature: { type: String, trim: true },
    weight: { type: String, trim: true },
    height: { type: String, trim: true },
    oxygenSaturation: { type: String, trim: true },
  },
  { timestamps: true }
);

vitalSignSchema.index({ patient: 1, date: -1 });

module.exports = mongoose.model("VitalSign", vitalSignSchema);

const mongoose = require("mongoose");

const medicalRecordSchema = new mongoose.Schema({
  patient: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  doctor: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  diagnosis: String,
  prescription: String,
  notes: String,
}, { timestamps: true });

module.exports = mongoose.model("MedicalRecord", medicalRecordSchema);
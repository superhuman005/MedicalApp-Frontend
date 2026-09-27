const mongoose = require("mongoose");

const labResultSchema = new mongoose.Schema(
  {
    patient: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    familyMember: { type: mongoose.Schema.Types.ObjectId, ref: "FamilyMember" },
    orderedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    date: { type: Date, default: Date.now },
    test: { type: String, required: true, trim: true },
    results: { type: String, trim: true },
    status: { type: String, enum: ["pending", "completed", "reviewed"], default: "completed" },
    fileUrl: { type: String, trim: true },
    fileName: { type: String, trim: true },
  },
  { timestamps: true }
);

labResultSchema.index({ patient: 1, date: -1 });

module.exports = mongoose.model("LabResult", labResultSchema);

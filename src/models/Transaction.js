const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema(
  {
    doctor: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    patient: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    appointment: { type: mongoose.Schema.Types.ObjectId, ref: "Appointment" },
    type: { type: String, enum: ["video", "chat", "followup"], required: true },
    amount: { type: Number, required: true, min: 0 },
    status: { type: String, enum: ["pending", "paid"], default: "pending" },
    date: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

transactionSchema.index({ doctor: 1, date: -1 });

module.exports = mongoose.model("Transaction", transactionSchema);

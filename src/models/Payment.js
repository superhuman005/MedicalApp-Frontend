const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
  {
    patient: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    plan: { type: String, enum: ["basic", "premium"], required: true },
    amount: { type: Number, required: true }, // in naira (not kobo)
    currency: { type: String, default: "NGN" },
    reference: { type: String, required: true, unique: true }, // Paystack transaction reference
    status: { type: String, enum: ["pending", "success", "failed"], default: "pending" },
    paidAt: { type: Date },
    gatewayResponse: { type: String, trim: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Payment", paymentSchema);

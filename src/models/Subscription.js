const mongoose = require("mongoose");

const PLAN_LIMITS = {
  free: { familyMemberLimit: 1, videoConsultationsLimit: 0, chatConsultationsLimit: 2, price: 0 },
  basic: { familyMemberLimit: 2, videoConsultationsLimit: 5, chatConsultationsLimit: Infinity, price: 7500 },
  premium: { familyMemberLimit: 4, videoConsultationsLimit: Infinity, chatConsultationsLimit: Infinity, price: 15000 },
};

const subscriptionSchema = new mongoose.Schema(
  {
    patient: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    plan: { type: String, enum: ["free", "basic", "premium"], default: "free" },
    status: { type: String, enum: ["active", "cancelled", "expired"], default: "active" },
    startDate: { type: Date, default: Date.now },
    endDate: { type: Date },
    autoRenew: { type: Boolean, default: true },
    videoConsultationsUsed: { type: Number, default: 0 },
    chatConsultationsUsed: { type: Number, default: 0 },
    // Reset monthly usage counters on this date
    currentPeriodStart: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

subscriptionSchema.methods.getLimits = function () {
  return PLAN_LIMITS[this.plan] || PLAN_LIMITS.free;
};

subscriptionSchema.statics.PLAN_LIMITS = PLAN_LIMITS;

module.exports = mongoose.model("Subscription", subscriptionSchema);

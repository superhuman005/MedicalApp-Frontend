const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    title: { type: String, required: true, trim: true },
    message: { type: String, trim: true },
    type: {
      type: String,
      enum: [
        "appointment",
        "consultation-request",
        "prescription",
        "lab-result",
        "subscription",
        "account",
        "system",
      ],
      default: "system",
    },
    relatedId: { type: mongoose.Schema.Types.ObjectId },
    isRead: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Notification", notificationSchema);

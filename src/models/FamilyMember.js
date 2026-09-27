const mongoose = require("mongoose");

const familyMemberSchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    name: { type: String, required: true, trim: true },
    relationship: {
      type: String,
      required: true,
      trim: true, // e.g. self, spouse, son, daughter, parent
    },
    age: { type: Number, min: 0 },
    dateOfBirth: { type: Date },
    gender: { type: String, enum: ["male", "female", "other", ""], default: "" },
    avatar: { type: String, default: "/placeholder.svg" },
    isSelf: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("FamilyMember", familyMemberSchema);

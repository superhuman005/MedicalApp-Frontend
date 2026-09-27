const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please provide a valid email"],
    },
    password: { type: String, required: true, minlength: 6, select: false },
    phone: { type: String, trim: true },
    role: {
      type: String,
      enum: ["patient", "doctor", "admin", "superadmin"],
      default: "patient",
    },
    avatar: { type: String, default: "/placeholder.svg" },
    isActive: { type: Boolean, default: true },

    // ---- Doctor-only fields ----
    specialization: { type: String, trim: true },
    medicalLicenseNumber: { type: String, trim: true },
    yearsOfExperience: { type: Number, min: 0 },
    bio: { type: String, trim: true, maxlength: 2000 },
    consultationFee: {
      video: { type: Number, default: 5000 },
      chat: { type: Number, default: 2500 },
    },
    status: {
      type: String,
      enum: ["online", "offline", "busy", "available"],
      default: "offline",
    },
    rating: { type: Number, default: 0, min: 0, max: 5 },
    ratingCount: { type: Number, default: 0 },
    // Doctors must be approved by an admin before they can go online/available
    // or appear in the patient-facing doctor list. Patients and admins are
    // auto-approved (the field is meaningless for them).
    doctorApprovalStatus: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "approved",
    },
    approvalNote: { type: String, trim: true }, // optional admin note on reject

    // ---- Patient-only fields ----
    dateOfBirth: { type: Date },
    gender: { type: String, enum: ["male", "female", "other", ""], default: "" },

    lastLogin: { type: Date },
  },
  { timestamps: true }
);

userSchema.index({ role: 1, specialization: 1 });
userSchema.index({ role: 1, status: 1 });

userSchema.virtual("fullName").get(function () {
  return `${this.firstName} ${this.lastName}`;
});

userSchema.set("toJSON", { virtuals: true });
userSchema.set("toObject", { virtuals: true });

// Hash password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Never leak password even if select("+password") was used and doc is returned raw
userSchema.methods.toSafeObject = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

module.exports = mongoose.model("User", userSchema);

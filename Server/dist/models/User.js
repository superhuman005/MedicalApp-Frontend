const mongoose = require("mongoose");
const userSchema = new mongoose.Schema({
    name: String,
    email: { type: String, unique: true },
    password: String,
    phone: String,
    role: { type: String, enum: ["patient", "doctor"], default: "patient" },
    specialization: String,
}, { timestamps: true });
// models/User.js
refreshToken: {
    type: String;
}
module.exports = mongoose.model("User", userSchema);
//# sourceMappingURL=User.js.map
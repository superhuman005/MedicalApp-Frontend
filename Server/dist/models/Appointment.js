const mongoose = require("mongoose");
const appointmentSchema = new mongoose.Schema({
    patient: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    doctor: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    date: Date,
    status: {
        type: String,
        enum: ["pending", "approved", "completed", "cancelled"],
        default: "pending"
    },
    videoRoomId: String
}, { timestamps: true });
module.exports = mongoose.model("Appointment", appointmentSchema);
//# sourceMappingURL=Appointment.js.map
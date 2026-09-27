const mongoose = require('mongoose');
const appointmentSchema = new mongoose.Schema({
    patient: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Patient',
        required: [true, 'Patient is required']
    },
    doctor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Doctor',
        required: [true, 'Doctor is required']
    },
    date: {
        type: Date,
        required: [true, 'Appointment date is required']
    },
    startTime: {
        type: String,
        required: [true, 'Start time is required'],
        match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Please provide a valid time in HH:MM format']
    },
    endTime: {
        type: String,
        required: [true, 'End time is required'],
        match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Please provide a valid time in HH:MM format']
    },
    type: {
        type: String,
        enum: ['consultation', 'follow-up', 'emergency', 'routine-checkup', 'video-consultation'],
        required: [true, 'Appointment type is required']
    },
    status: {
        type: String,
        enum: ['pending', 'confirmed', 'in-progress', 'completed', 'cancelled', 'no-show', 'rescheduled'],
        default: 'pending'
    },
    reason: {
        type: String,
        required: [true, 'Reason for appointment is required'],
        maxlength: [500, 'Reason cannot exceed 500 characters']
    },
    symptoms: [{
            type: String,
            trim: true
        }],
    notes: {
        type: String,
        maxlength: [1000, 'Notes cannot exceed 1000 characters'],
        default: ''
    },
    prescription: {
        type: String,
        default: ''
    },
    diagnosis: {
        type: String,
        default: ''
    },
    followUpDate: {
        type: Date,
        default: null
    },
    fee: {
        amount: {
            type: Number,
            required: true,
            min: [0, 'Fee cannot be negative']
        },
        currency: {
            type: String,
            default: 'NGN'
        },
        isPaid: {
            type: Boolean,
            default: false
        },
        paidAt: {
            type: Date,
            default: null
        }
    },
    meetingLink: {
        type: String,
        default: null
    },
    cancelledAt: {
        type: Date,
        default: null
    },
    cancelledBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    cancellationReason: {
        type: String
    },
    reminders: [{
            type: {
                type: String,
                enum: ['email', 'sms', 'push']
            },
            sentAt: Date,
            status: {
                type: String,
                enum: ['pending', 'sent', 'failed']
            }
        }]
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});
appointmentSchema.virtual('consultation', {
    ref: 'Consultation',
    localField: '_id',
    foreignField: 'appointment'
});
appointmentSchema.index({ patient: 1, date: -1 });
appointmentSchema.index({ doctor: 1, date: -1 });
appointmentSchema.index({ status: 1 });
appointmentSchema.index({ date: 1 });
module.exports = mongoose.model('Appointment', appointmentSchema);
//# sourceMappingURL=Appointment.js.map
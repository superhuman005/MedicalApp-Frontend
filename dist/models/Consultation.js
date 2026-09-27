const mongoose = require('mongoose');
const consultationSchema = new mongoose.Schema({
    appointment: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Appointment',
        required: true,
        unique: true
    },
    patient: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Patient',
        required: true
    },
    doctor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Doctor',
        required: true
    },
    type: {
        type: String,
        enum: ['in-person', 'video', 'phone'],
        required: [true, 'Consultation type is required']
    },
    status: {
        type: String,
        enum: ['scheduled', 'in-progress', 'completed', 'cancelled'],
        default: 'scheduled'
    },
    startedAt: {
        type: Date,
        default: null
    },
    endedAt: {
        type: Date,
        default: null
    },
    duration: {
        type: Number,
        default: 0
    },
    symptoms: [{
            name: {
                type: String,
                required: true
            },
            duration: String,
            severity: {
                type: String,
                enum: ['mild', 'moderate', 'severe'],
                default: 'moderate'
            },
            notes: String
        }],
    diagnosis: {
        primary: String,
        secondary: [String],
        icdCode: String,
        notes: String
    },
    treatmentPlan: {
        medications: [{
                name: String,
                dosage: String,
                frequency: String,
                duration: String,
                instructions: String
            }],
        procedures: [String],
        lifestyle: [{
                category: {
                    type: String,
                    enum: ['diet', 'exercise', 'sleep', 'other']
                },
                recommendation: String
            }]
    },
    prescriptions: [{
            medication: String,
            dosage: String,
            frequency: String,
            duration: String,
            refills: {
                type: Number,
                default: 0
            },
            notes: String
        }],
    referral: {
        isReferred: {
            type: Boolean,
            default: false
        },
        referredTo: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Doctor'
        },
        reason: String,
        notes: String
    },
    followUp: {
        required: {
            type: Boolean,
            default: false
        },
        date: Date,
        notes: String
    },
    doctorNotes: {
        type: String,
        maxlength: [2000, 'Notes cannot exceed 2000 characters'],
        default: ''
    },
    patientFeedback: {
        rating: {
            type: Number,
            min: 1,
            max: 5
        },
        comment: String,
        submittedAt: Date
    },
    recordings: [{
            type: String,
            url: String,
            duration: Number,
            uploadedAt: { type: Date, default: Date.now }
        }],
    transcript: {
        type: String,
        default: ''
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});
consultationSchema.index({ patient: 1, createdAt: -1 });
consultationSchema.index({ doctor: 1, createdAt: -1 });
consultationSchema.index({ status: 1 });
consultationSchema.index({ appointment: 1 });
module.exports = mongoose.model('Consultation', consultationSchema);
//# sourceMappingURL=Consultation.js.map
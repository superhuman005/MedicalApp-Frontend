const mongoose = require('mongoose');
const doctorSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    specialization: {
        type: String,
        required: [true, 'Specialization is required'],
        trim: true
    },
    qualification: {
        type: String,
        default: '',
        trim: true
    },
    medicalLicenseNumber: {
        type: String,
        required: [true, 'Medical license number is required'],
        unique: true,
        trim: true
    },
    yearsOfExperience: {
        type: Number,
        required: [true, 'Years of experience is required'],
        min: [0, 'Years of experience cannot be negative']
    },
    bio: {
        type: String,
        maxlength: [500, 'Bio cannot exceed 500 characters'],
        default: ''
    },
    consultationFee: {
        type: Number,
        default: 0,
        min: [0, 'Consultation fee cannot be negative']
    },
    availableDays: [{
            type: String,
            enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
        }],
    availableHours: {
        start: {
            type: String,
            default: '09:00'
        },
        end: {
            type: String,
            default: '17:00'
        }
    },
    hospitalAffiliations: [{
            name: String,
            address: String
        }],
    languages: [{
            type: String
        }],
    rating: {
        average: {
            type: Number,
            default: 0,
            min: 0,
            max: 5
        },
        count: {
            type: Number,
            default: 0
        }
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    isAvailable: {
        type: Boolean,
        default: true
    },
    documents: [{
            type: String,
            name: String,
            url: String,
            uploadedAt: { type: Date, default: Date.now }
        }]
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});
doctorSchema.virtual('reviews', {
    ref: 'Review',
    localField: '_id',
    foreignField: 'doctor'
});
doctorSchema.index({ specialization: 1 });
doctorSchema.index({ isAvailable: 1 });
doctorSchema.index({ 'rating.average': -1 });
module.exports = mongoose.model('Doctor', doctorSchema);
//# sourceMappingURL=Doctor.js.map
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        lowercase: true,
        trim: true,
        match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email']
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: [6, 'Password must be at least 6 characters'],
        select: false
    },
    firstName: {
        type: String,
        required: [true, 'First name is required'],
        trim: true,
        maxlength: [50, 'First name cannot exceed 50 characters']
    },
    lastName: {
        type: String,
        required: [true, 'Last name is required'],
        trim: true,
        maxlength: [50, 'Last name cannot exceed 50 characters']
    },
    phone: {
        type: String,
        trim: true,
        match: [/^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/, 'Please provide a valid phone number']
    },
    role: {
        type: String,
        enum: ['patient', 'doctor', 'admin'],
        default: 'patient'
    },
    avatar: {
        type: String,
        default: ''
    },
    isEmailVerified: {
        type: Boolean,
        default: false
    },
    isActive: {
        type: Boolean,
        default: true
    },
    lastLogin: {
        type: Date,
        default: null
    },
    passwordResetToken: String,
    passwordResetExpires: Date,
    emailVerificationToken: String
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});
userSchema.virtual('fullName').get(function () {
    return `${this.firstName} ${this.lastName}`;
});
userSchema.pre('save', async function (next) {
    if (!this.isModified('password'))
        return next();
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});
userSchema.methods.comparePassword = async function (candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};
userSchema.methods.generatePasswordResetToken = function () {
    const crypto = require('crypto');
    const token = crypto.randomBytes(32).toString('hex');
    this.passwordResetToken = crypto
        .createHash('sha256')
        .update(token)
        .digest('hex');
    this.passwordResetExpires = Date.now() + 3600000; // 1 hour
    return token;
};
userSchema.methods.generateEmailVerificationToken = function () {
    const crypto = require('crypto');
    const token = crypto.randomBytes(32).toString('hex');
    this.emailVerificationToken = crypto
        .createHash('sha256')
        .update(token)
        .digest('hex');
    return token;
};
userSchema.index({ email: 1 });
userSchema.index({ role: 1 });
module.exports = mongoose.model('User', userSchema);
//# sourceMappingURL=User.js.map
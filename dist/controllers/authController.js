const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { User, Doctor, Patient } = require('../models');
const { asyncHandler } = require('../routes/middleware/validate');
const emailService = require('../services/emailService');
const generateToken = (user) => {
    return jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });
};
const sendTokenResponse = (user, statusCode, res) => {
    const token = generateToken(user);
    const options = {
        expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict'
    };
    res.status(statusCode).json({
        success: true,
        token,
        user: {
            id: user._id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
            avatar: user.avatar,
            isEmailVerified: user.isEmailVerified
        }
    });
};
exports.register = asyncHandler(async (req, res) => {
    const { email, password, firstName, lastName, phone, role, ...additionalData } = req.body;
    const existingUser = await User.findOne({ email });
    if (existingUser) {
        return res.status(400).json({
            success: false,
            message: 'User with this email already exists'
        });
    }
    const user = await User.create({
        email,
        password,
        firstName,
        lastName,
        phone,
        role: role || 'patient'
    });
    try {
        if (user.role === 'patient') {
            await Patient.create({
                user: user._id,
                ...additionalData
            });
        }
        else if (user.role === 'doctor') {
            await Doctor.create({
                user: user._id,
                ...additionalData
            });
        }
    }
    catch (profileError) {
        await User.findByIdAndDelete(user._id);
        return res.status(400).json({
            success: false,
            message: profileError.message || 'Failed to create user profile'
        });
    }
    const verificationToken = user.generateEmailVerificationToken();
    await user.save({ validateBeforeSave: false });
    const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`;
    await emailService.sendVerificationEmail(user.email, {
        name: user.firstName,
        verificationUrl
    });
    sendTokenResponse(user, 201, res);
});
exports.login = asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({
            success: false,
            message: 'Please provide email and password'
        });
    }
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
        return res.status(401).json({
            success: false,
            message: 'Invalid credentials'
        });
    }
    if (!user.isActive) {
        return res.status(401).json({
            success: false,
            message: 'Account has been deactivated'
        });
    }
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
        return res.status(401).json({
            success: false,
            message: 'Invalid credentials'
        });
    }
    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });
    sendTokenResponse(user, 200, res);
});
exports.logout = asyncHandler(async (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Logged out successfully'
    });
});
exports.getMe = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user.id);
    let profileData = null;
    if (user.role === 'patient') {
        profileData = await Patient.findOne({ user: user._id });
    }
    else if (user.role === 'doctor') {
        profileData = await Doctor.findOne({ user: user._id }).populate('reviews');
    }
    res.status(200).json({
        success: true,
        data: {
            user,
            profile: profileData
        }
    });
});
exports.updateProfile = asyncHandler(async (req, res) => {
    const allowedFields = ['firstName', 'lastName', 'phone', 'avatar'];
    const updates = {};
    allowedFields.forEach(field => {
        if (req.body[field] !== undefined) {
            updates[field] = req.body[field];
        }
    });
    const user = await User.findByIdAndUpdate(req.user.id, updates, { new: true, runValidators: true });
    res.status(200).json({
        success: true,
        data: user
    });
});
exports.updatePassword = asyncHandler(async (req, res) => {
    const { currentPassword, newPassword, confirmPassword } = req.body;
    if (!currentPassword || !newPassword || !confirmPassword) {
        return res.status(400).json({
            success: false,
            message: 'Please provide all password fields'
        });
    }
    if (newPassword !== confirmPassword) {
        return res.status(400).json({
            success: false,
            message: 'New passwords do not match'
        });
    }
    const user = await User.findById(req.user.id).select('+password');
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
        return res.status(401).json({
            success: false,
            message: 'Current password is incorrect'
        });
    }
    user.password = newPassword;
    await user.save();
    sendTokenResponse(user, 200, res);
});
exports.forgotPassword = asyncHandler(async (req, res) => {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
        return res.status(404).json({
            success: false,
            message: 'No user found with this email'
        });
    }
    const resetToken = user.generatePasswordResetToken();
    await user.save({ validateBeforeSave: false });
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
    try {
        await emailService.sendPasswordResetEmail(user.email, {
            name: user.firstName,
            resetUrl
        });
        res.status(200).json({
            success: true,
            message: 'Password reset email sent'
        });
    }
    catch (error) {
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        await user.save({ validateBeforeSave: false });
        return res.status(500).json({
            success: false,
            message: 'Email could not be sent'
        });
    }
});
exports.resetPassword = asyncHandler(async (req, res) => {
    const { token, password, confirmPassword } = req.body;
    if (password !== confirmPassword) {
        return res.status(400).json({
            success: false,
            message: 'Passwords do not match'
        });
    }
    const hashedToken = crypto
        .createHash('sha256')
        .update(token)
        .digest('hex');
    const user = await User.findOne({
        passwordResetToken: hashedToken,
        passwordResetExpires: { $gt: Date.now() }
    });
    if (!user) {
        return res.status(400).json({
            success: false,
            message: 'Invalid or expired reset token'
        });
    }
    user.password = password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();
    sendTokenResponse(user, 200, res);
});
exports.verifyEmail = asyncHandler(async (req, res) => {
    const { token } = req.body;
    const hashedToken = crypto
        .createHash('sha256')
        .update(token)
        .digest('hex');
    const user = await User.findOne({
        emailVerificationToken: hashedToken
    });
    if (!user) {
        return res.status(400).json({
            success: false,
            message: 'Invalid verification token'
        });
    }
    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    await user.save();
    res.status(200).json({
        success: true,
        message: 'Email verified successfully'
    });
});
exports.resendVerification = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user.id);
    if (user.isEmailVerified) {
        return res.status(400).json({
            success: false,
            message: 'Email is already verified'
        });
    }
    const verificationToken = user.generateEmailVerificationToken();
    await user.save({ validateBeforeSave: false });
    const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`;
    await emailService.sendVerificationEmail(user.email, {
        name: user.firstName,
        verificationUrl
    });
    res.status(200).json({
        success: true,
        message: 'Verification email sent'
    });
});
exports.refreshToken = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user.id);
    if (!user || !user.isActive) {
        return res.status(401).json({
            success: false,
            message: 'Invalid user'
        });
    }
    sendTokenResponse(user, 200, res);
});
//# sourceMappingURL=authController.js.map
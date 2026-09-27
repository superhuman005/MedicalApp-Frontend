const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { protect, authorize } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const authController = require('../../controllers/authController');
const registerValidation = [
    body('email').isEmail().withMessage('Please provide a valid email'),
    body('password')
        .isLength({ min: 6 })
        .withMessage('Password must be at least 6 characters'),
    body('firstName').notEmpty().withMessage('First name is required'),
    body('lastName').notEmpty().withMessage('Last name is required'),
    validate
];
const loginValidation = [
    body('email').isEmail().withMessage('Please provide a valid email'),
    body('password').notEmpty().withMessage('Password is required'),
    validate
];
const updatePasswordValidation = [
    body('currentPassword').notEmpty().withMessage('Current password is required'),
    body('newPassword')
        .isLength({ min: 6 })
        .withMessage('New password must be at least 6 characters'),
    body('confirmPassword').notEmpty().withMessage('Please confirm your new password'),
    validate
];
const resetPasswordValidation = [
    body('token').notEmpty().withMessage('Reset token is required'),
    body('password')
        .isLength({ min: 6 })
        .withMessage('Password must be at least 6 characters'),
    body('confirmPassword').notEmpty().withMessage('Please confirm your password'),
    validate
];
router.post('/register', registerValidation, authController.register);
router.post('/login', loginValidation, authController.login);
router.post('/logout', authController.logout);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', resetPasswordValidation, authController.resetPassword);
router.post('/verify-email', authController.verifyEmail);
router.get('/me', protect, authController.getMe);
router.put('/profile', protect, authController.updateProfile);
router.put('/password', protect, updatePasswordValidation, authController.updatePassword);
router.post('/resend-verification', protect, authController.resendVerification);
router.post('/refresh-token', protect, authController.refreshToken);
router.get('/admin/users', protect, authorize('admin'), async (req, res) => {
    const { User } = require('../../models');
    const users = await User.find().select('-password');
    res.json({ success: true, data: users });
});
module.exports = router;
//# sourceMappingURL=auth.js.map
const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { v4: uuidv4 } = require("uuid");
const generateAccessToken = (user) => {
    return jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: "15m" });
};
const generateRefreshToken = () => {
    return uuidv4();
};
exports.login = async (req, res) => {
    const user = await User.findOne({ email: req.body.email });
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken();
    user.refreshToken = refreshToken;
    await user.save();
    res.json({ accessToken, refreshToken });
};
exports.refreshToken = async (req, res) => {
    const { refreshToken } = req.body;
    const user = await User.findOne({ refreshToken });
    if (!user)
        return res.status(403).json({ message: "Invalid refresh token" });
    const accessToken = generateAccessToken(user);
    res.json({ accessToken });
};
//# sourceMappingURL=authController.js.map
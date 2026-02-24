// controllers/adminController.js
const User = require("../../models/User");
const Appointment = require("../../models/Appointment");

exports.getAllUsers = async (req, res) => {
  const users = await User.find();
  res.json(users);
};

exports.deleteUser = async (req, res) => {
  await User.findByIdAndDelete(req.params.id);
  res.json({ message: "User deleted" });
};

exports.dashboardStats = async (req, res) => {
  const totalUsers = await User.countDocuments();
  const totalAppointments = await Appointment.countDocuments();

  res.json({ totalUsers, totalAppointments });
};
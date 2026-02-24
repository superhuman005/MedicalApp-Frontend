const Appointment = require("../models/Appointment");
const sendEmail = require("../services/emailService");
const sendSMS = require("../services/smsService");

exports.bookAppointment = async (req, res) => {
  const { doctorId, date } = req.body;

  const appointment = await Appointment.create({
    patient: req.user.id,
    doctor: doctorId,
    date,
    videoRoomId: `room-${Date.now()}`
  });

  await sendEmail(
    req.user.email,
    "Appointment Booked",
    "Your appointment has been scheduled."
  );

  res.json(appointment);
};

exports.getAppointments = async (req, res) => {
  const appointments = await Appointment.find({
    $or: [{ patient: req.user.id }, { doctor: req.user.id }]
  }).populate("patient doctor");

  res.json(appointments);
};

exports.generateVideoToken = async (req, res) => {
  const { roomId } = req.body;
  res.json({ token: `secure-token-for-${roomId}` });
};
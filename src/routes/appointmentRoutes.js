const express = require("express");
const {
  bookAppointment,
  getMyAppointments,
  getAppointmentById,
  updateAppointmentStatus,
  cancelAppointment,
} = require("../controllers/appointmentController");
const { protect, restrictTo } = require("../middleware/auth");

const router = express.Router();

router.use(protect);

router.post("/", restrictTo("patient"), bookAppointment);
router.get("/", getMyAppointments);
router.get("/:id", getAppointmentById);
router.patch("/:id/status", updateAppointmentStatus);
router.delete("/:id", cancelAppointment);

module.exports = router;

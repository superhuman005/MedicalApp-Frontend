const router = require("express").Router();
const auth = require("../middleware/authMiddleware");
const { bookAppointment, getAppointments } = require("../controllers/appointmentController");
router.post("/", auth, bookAppointment);
router.get("/", auth, getAppointments);
module.exports = router;
//# sourceMappingURL=appointmentRoutes.js.map
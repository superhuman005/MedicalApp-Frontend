const express = require("express");
const { register, doctorRegister, login, getMe, logout, updatePassword } = require("../controllers/authController");
const { protect } = require("../middleware/auth");

const router = express.Router();

router.post("/register", register);
// Unlisted - not linked anywhere in the public frontend. Doctors are normally
// created pre-approved by an admin (POST /api/admin/doctors); this route
// exists for a doctor to self-apply, which then goes through the normal
// pending-approval queue. See authController.doctorRegister for details.
router.post("/doctor-register", doctorRegister);
router.post("/login", login);
router.get("/me", protect, getMe);
router.post("/logout", protect, logout);
router.patch("/update-password", protect, updatePassword);

module.exports = router;

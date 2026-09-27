const express = require("express");
const { getDoctors, getDoctorById, updateStatus, updateProfile } = require("../controllers/doctorController");
const { protect, restrictTo } = require("../middleware/auth");

const router = express.Router();

router.use(protect);

router.get("/", getDoctors);
router.patch("/me/status", restrictTo("doctor"), updateStatus);
router.patch("/me/profile", restrictTo("doctor"), updateProfile);
router.get("/:id", getDoctorById);

module.exports = router;

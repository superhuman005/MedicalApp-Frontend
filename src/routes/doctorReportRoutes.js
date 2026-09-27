const express = require("express");
const { createReport, getMyReports } = require("../controllers/doctorReportController");
const { protect, restrictTo } = require("../middleware/auth");

const router = express.Router();

router.use(protect, restrictTo("doctor"));
router.post("/", createReport);
router.get("/mine", getMyReports);

module.exports = router;

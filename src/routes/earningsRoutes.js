const express = require("express");
const { getSummary, getTransactions } = require("../controllers/earningsController");
const { protect, restrictTo } = require("../middleware/auth");

const router = express.Router();

router.use(protect, restrictTo("doctor"));

router.get("/summary", getSummary);
router.get("/transactions", getTransactions);

module.exports = router;

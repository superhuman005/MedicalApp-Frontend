const express = require("express");
const { initializePayment, verifyPayment, handleWebhook, getMyPayments } = require("../controllers/paymentController");
const { protect, restrictTo } = require("../middleware/auth");

const router = express.Router();

// Paystack calls this directly - must stay unauthenticated, verified via signature instead.
router.post("/webhook", handleWebhook);

router.use(protect, restrictTo("patient"));
router.post("/initialize", initializePayment);
router.get("/verify/:reference", verifyPayment);
router.get("/", getMyPayments);

module.exports = router;

const express = require("express");
const {
  getPlans,
  getCurrentSubscription,
  subscribe,
  cancelSubscription,
} = require("../controllers/subscriptionController");
const { protect, restrictTo } = require("../middleware/auth");

const router = express.Router();

router.get("/plans", getPlans);

router.use(protect, restrictTo("patient"));
router.get("/current", getCurrentSubscription);
router.post("/subscribe", subscribe);
router.post("/cancel", cancelSubscription);

module.exports = router;

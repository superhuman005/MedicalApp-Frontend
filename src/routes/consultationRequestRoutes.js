const express = require("express");
const {
  createRequest,
  getRequests,
  acceptRequest,
  declineRequest,
  cancelRequest,
} = require("../controllers/consultationRequestController");
const { protect, restrictTo } = require("../middleware/auth");

const router = express.Router();

router.use(protect);

router.post("/", restrictTo("patient"), createRequest);
router.get("/", getRequests);
router.patch("/:id/accept", restrictTo("doctor"), acceptRequest);
router.patch("/:id/decline", restrictTo("doctor"), declineRequest);
router.patch("/:id/cancel", restrictTo("patient"), cancelRequest);

module.exports = router;

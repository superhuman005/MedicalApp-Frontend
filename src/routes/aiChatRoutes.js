const express = require("express");
const { chat } = require("../controllers/aiChatController");
const { protect } = require("../middleware/auth");

const router = express.Router();

router.post("/", protect, chat);

module.exports = router;

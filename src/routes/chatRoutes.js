const express = require("express");
const { getMessages, sendMessage } = require("../controllers/chatController");
const { protect } = require("../middleware/auth");

const router = express.Router();

router.use(protect);

router
  .route("/:conversationModel/:conversationId/messages")
  .get(getMessages)
  .post(sendMessage);

module.exports = router;

const express = require("express");
const { updateMe, uploadAvatar, getUserById } = require("../controllers/userController");
const { protect } = require("../middleware/auth");
const upload = require("../middleware/upload");

const router = express.Router();

router.use(protect);

router.patch("/me", updateMe);
router.post("/me/avatar", upload.single("avatar"), uploadAvatar);
router.get("/:id", getUserById);

module.exports = router;

const express = require("express");
const {
  getFamilyMembers,
  addFamilyMember,
  updateFamilyMember,
  deleteFamilyMember,
} = require("../controllers/familyMemberController");
const { protect, restrictTo } = require("../middleware/auth");

const router = express.Router();

router.use(protect, restrictTo("patient"));

router.get("/", getFamilyMembers);
router.post("/", addFamilyMember);
router.patch("/:id", updateFamilyMember);
router.delete("/:id", deleteFamilyMember);

module.exports = router;

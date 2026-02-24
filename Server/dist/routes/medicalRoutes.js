const router = require("express").Router();
const auth = require("../middleware/authMiddleware");
const role = require("../middleware/roleMiddleware");
const { createRecord, getRecords } = require("../controllers/medicalController");
router.post("/", auth, role("doctor"), createRecord);
router.get("/", auth, getRecords);
module.exports = router;
//# sourceMappingURL=medicalRoutes.js.map
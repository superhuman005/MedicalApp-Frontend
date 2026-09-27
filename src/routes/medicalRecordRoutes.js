const express = require("express");
const {
  getConsultations,
  createConsultation,
  getPrescriptions,
  createPrescription,
  sendPrescriptionToAdmin,
  updatePrescriptionStatus,
  getVitals,
  createVital,
  getLabResults,
  createLabResult,
} = require("../controllers/medicalRecordController");
const { protect, restrictTo } = require("../middleware/auth");
const upload = require("../middleware/upload");

const router = express.Router();

router.use(protect);

router
  .route("/consultations")
  .get(getConsultations)
  .post(restrictTo("doctor"), createConsultation);

router
  .route("/prescriptions")
  .get(getPrescriptions)
  .post(restrictTo("doctor"), createPrescription);
router.patch("/prescriptions/:id/status", updatePrescriptionStatus);
router.patch("/prescriptions/:id/send-to-admin", restrictTo("doctor"), sendPrescriptionToAdmin);

router.route("/vitals").get(getVitals).post(createVital);

router
  .route("/labs")
  .get(getLabResults)
  .post(restrictTo("doctor"), upload.single("file"), createLabResult);

module.exports = router;

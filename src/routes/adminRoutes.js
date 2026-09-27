const express = require("express");
const {
  getOverview,
  getUsers,
  getPendingDoctors,
  getAllDoctors,
  approveDoctor,
  rejectDoctor,
  getAllAppointments,
  getDoctorReports,
  markReportReviewed,
  getAllPayments,
  getAdminPrescriptions,
  updateAdminPrescriptionStatus,
  getAdmins,
  createAdmin,
  createDoctor,
} = require("../controllers/adminController");
const { protect, restrictTo } = require("../middleware/auth");

const router = express.Router();

// All admin routes require at least "admin"; doctor approval additionally
// requires "superadmin" - see the two restrictTo calls below.
router.use(protect, restrictTo("admin", "superadmin"));

router.get("/overview", getOverview);
router.get("/users", getUsers);
router.get("/doctors/pending", getPendingDoctors);
router.get("/doctors", getAllDoctors);
// Any admin can create a doctor account directly (pre-approved, since the
// admin is vetting them up front) - this replaces the old public doctor signup.
router.post("/doctors", createDoctor);
router.get("/appointments", getAllAppointments);
router.get("/doctor-reports", getDoctorReports);
router.patch("/doctor-reports/:id/review", markReportReviewed);
router.get("/payments", getAllPayments);

// Prescriptions doctors have sent to the admin team
router.get("/prescriptions", getAdminPrescriptions);
router.patch("/prescriptions/:id/status", updateAdminPrescriptionStatus);

// Admin management - any admin can list and add other admins
router.get("/admins", getAdmins);
router.post("/admins", createAdmin);

// Only super admins can approve/reject doctor applications.
router.patch("/doctors/:id/approve", restrictTo("superadmin"), approveDoctor);
router.patch("/doctors/:id/reject", restrictTo("superadmin"), rejectDoctor);

module.exports = router;

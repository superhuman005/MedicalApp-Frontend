const Consultation = require("../models/Consultation");
const Prescription = require("../models/Prescription");
const VitalSign = require("../models/VitalSign");
const LabResult = require("../models/LabResult");
const FamilyMember = require("../models/FamilyMember");
const User = require("../models/User");
const catchAsync = require("../utils/catchAsync");
const ApiError = require("../utils/ApiError");
const { notify, notifyMany } = require("../utils/notify");

// Resolves which patient (User) id records should be scoped to, and verifies
// the requesting user is allowed to see them. Patients can only view their own
// family's records (via ?familyMemberId=); doctors can view any patient's
// records (in a real system this would be restricted to patients they've treated).
const resolveScope = async (req) => {
  const { familyMemberId, patientId } = req.query;

  if (req.user.role === "doctor") {
    if (!patientId) throw new ApiError(400, "patientId query parameter is required");
    return { patient: patientId, familyMember: familyMemberId || null };
  }

  // patient role
  const scope = { patient: req.user._id };
  if (familyMemberId) {
    const member = await FamilyMember.findOne({ _id: familyMemberId, owner: req.user._id });
    if (!member) throw new ApiError(404, "Patient profile not found");
    scope.familyMember = familyMemberId;
  }
  return scope;
};

const buildFilter = (scope) => {
  const filter = { patient: scope.patient };
  if (scope.familyMember) filter.familyMember = scope.familyMember;
  return filter;
};

/* ---------------------------- Consultations ---------------------------- */

const getConsultations = catchAsync(async (req, res) => {
  const scope = await resolveScope(req);
  const records = await Consultation.find(buildFilter(scope))
    .populate("doctor", "firstName lastName specialization avatar")
    .populate("familyMember", "name relationship")
    .sort({ date: -1 });
  res.status(200).json({ success: true, count: records.length, consultations: records });
});

const createConsultation = catchAsync(async (req, res) => {
  if (req.user.role !== "doctor") throw new ApiError(403, "Only doctors can create consultation notes");

  const { patientId, familyMemberId, appointmentId, date, specialty, diagnosis, prescription, notes, status } =
    req.body;
  if (!patientId) throw new ApiError(400, "patientId is required");

  const record = await Consultation.create({
    patient: patientId,
    familyMember: familyMemberId || undefined,
    doctor: req.user._id,
    appointment: appointmentId || undefined,
    date: date || Date.now(),
    specialty: specialty || req.user.specialization,
    diagnosis,
    prescription,
    notes,
    status,
  });

  if (status === "completed") {
    const patient = await User.findById(patientId);
    if (patient) {
      notify({
        io: req.app.get("io"),
        user: patient,
        title: "Consultation Summary Ready",
        message: `Dr. ${req.user.lastName} added a summary from your recent consultation.`,
        type: "appointment",
        relatedId: record._id,
        email: {
          template: "sendConsultationSummary",
          data: {
            patientName: `${patient.firstName} ${patient.lastName}`,
            date: new Date(record.date).toLocaleDateString(),
            duration: "N/A",
            diagnosis: diagnosis || "See your medical records for full notes",
          },
        },
      }).catch((err) => console.error("[createConsultation] Notify failed:", err.message));
    }
  }

  res.status(201).json({ success: true, consultation: record });
});

/* ---------------------------- Prescriptions ---------------------------- */

// Marks a prescription as sent to the admin team, notifies every active admin
// (in-app notification + live socket event) and returns the populated document.
const sendPrescriptionToAdmins = async (req, prescription) => {
  prescription.adminStatus = "pending";
  prescription.sentToAdminAt = new Date();
  prescription.adminNote = undefined;
  prescription.handledBy = undefined;
  prescription.handledAt = undefined;
  await prescription.save();

  const populated = await prescription.populate([
    { path: "patient", select: "firstName lastName email phone" },
    { path: "familyMember", select: "name relationship" },
    { path: "prescribedBy", select: "firstName lastName specialization" },
  ]);

  const io = req.app.get("io");
  io?.to("role:admin").to("role:superadmin").emit("prescription:new", populated);

  const admins = await User.find({ role: { $in: ["admin", "superadmin"] }, isActive: true });
  notifyMany(admins, {
    io,
    title: "New prescription to review",
    message: `Dr. ${req.user.lastName} sent a prescription for ${prescription.medication}`,
    type: "prescription",
    relatedId: prescription._id,
    emailTemplate: "sendGenericNotification",
    emailData: (admin) => ({
      title: "New Prescription to Review",
      name: admin.firstName,
      message: `Dr. ${req.user.firstName} ${req.user.lastName} sent a prescription for ${prescription.medication} that needs your review.`,
      ctaLabel: "Review Prescription",
      ctaUrl: process.env.FRONTEND_URL ? `${process.env.FRONTEND_URL}/admin-dashboard` : undefined,
    }),
  }).catch((err) => console.error("[sendPrescriptionToAdmins] Notify failed:", err.message));

  return populated;
};

const getPrescriptions = catchAsync(async (req, res) => {
  const scope = await resolveScope(req);
  const records = await Prescription.find(buildFilter(scope))
    .populate("prescribedBy", "firstName lastName specialization")
    .populate("familyMember", "name relationship")
    .sort({ date: -1 });
  res.status(200).json({ success: true, count: records.length, prescriptions: records });
});

const createPrescription = catchAsync(async (req, res) => {
  if (req.user.role !== "doctor") throw new ApiError(403, "Only doctors can create prescriptions");

  const { patientId, familyMemberId, consultationId, medication, dosage, instructions, date, refills, sendToAdmin } =
    req.body;
  if (!patientId || !medication) throw new ApiError(400, "patientId and medication are required");

  const record = await Prescription.create({
    patient: patientId,
    familyMember: familyMemberId || undefined,
    prescribedBy: req.user._id,
    consultation: consultationId || undefined,
    medication,
    dosage,
    instructions,
    date: date || Date.now(),
    refills: refills || 0,
  });

  const patient = await User.findById(patientId);
  if (patient) {
    notify({
      io: req.app.get("io"),
      user: patient,
      title: "New Prescription",
      message: `Dr. ${req.user.lastName} prescribed ${medication} for you.`,
      type: "prescription",
      relatedId: record._id,
      email: {
        template: "sendNewPrescription",
        data: {
          patientName: `${patient.firstName} ${patient.lastName}`,
          doctorName: req.user.lastName,
          medication,
          dosage,
          instructions,
        },
      },
    }).catch((err) => console.error("[createPrescription] Notify failed:", err.message));
  }

  // Optionally hand the prescription to the admin team straight away
  if (sendToAdmin === true || sendToAdmin === "true") {
    await sendPrescriptionToAdmins(req, record);
  }

  res.status(201).json({ success: true, prescription: record });
});

// @desc    Send an existing prescription to the admin team
// @route   PATCH /api/medical-records/prescriptions/:id/send-to-admin
// @access  Private (doctor who wrote it)
const sendPrescriptionToAdmin = catchAsync(async (req, res) => {
  const record = await Prescription.findById(req.params.id);
  if (!record) throw new ApiError(404, "Prescription not found");
  if (!record.prescribedBy.equals(req.user._id)) {
    throw new ApiError(403, "You can only send prescriptions you wrote");
  }
  if (record.adminStatus === "pending" || record.adminStatus === "fulfilled") {
    throw new ApiError(400, `This prescription has already been sent to the admin team (${record.adminStatus})`);
  }

  await sendPrescriptionToAdmins(req, record);
  res.status(200).json({ success: true, prescription: record });
});

const updatePrescriptionStatus = catchAsync(async (req, res) => {
  const { status } = req.body;
  const allowed = ["active", "completed", "expired", "cancelled"];
  if (!allowed.includes(status)) throw new ApiError(400, `status must be one of: ${allowed.join(", ")}`);

  const record = await Prescription.findById(req.params.id);
  if (!record) throw new ApiError(404, "Prescription not found");

  const isOwner = record.patient.equals(req.user._id) || record.prescribedBy.equals(req.user._id);
  if (!isOwner) throw new ApiError(403, "Not authorized");

  record.status = status;
  await record.save();
  res.status(200).json({ success: true, prescription: record });
});

/* ------------------------------ Vitals ---------------------------------- */

const getVitals = catchAsync(async (req, res) => {
  const scope = await resolveScope(req);
  const records = await VitalSign.find(buildFilter(scope)).sort({ date: -1 });
  res.status(200).json({ success: true, count: records.length, vitals: records });
});

const createVital = catchAsync(async (req, res) => {
  const { patientId, familyMemberId, date, bloodPressure, heartRate, temperature, weight, height, oxygenSaturation } =
    req.body;

  // Patients can self-log vitals; doctors can log on behalf of a patient
  const patient = req.user.role === "doctor" ? patientId : req.user._id;
  if (!patient) throw new ApiError(400, "patientId is required");

  const record = await VitalSign.create({
    patient,
    familyMember: familyMemberId || undefined,
    recordedBy: req.user._id,
    date: date || Date.now(),
    bloodPressure,
    heartRate,
    temperature,
    weight,
    height,
    oxygenSaturation,
  });

  res.status(201).json({ success: true, vital: record });
});

/* ----------------------------- Lab Results ------------------------------ */

const getLabResults = catchAsync(async (req, res) => {
  const scope = await resolveScope(req);
  const records = await LabResult.find(buildFilter(scope))
    .populate("orderedBy", "firstName lastName specialization")
    .sort({ date: -1 });
  res.status(200).json({ success: true, count: records.length, labResults: records });
});

const createLabResult = catchAsync(async (req, res) => {
  if (req.user.role !== "doctor") throw new ApiError(403, "Only doctors can add lab results");

  const { patientId, familyMemberId, test, results, date, status } = req.body;
  if (!patientId || !test) throw new ApiError(400, "patientId and test are required");

  const fileUrl = req.file ? `/uploads/${req.file.filename}` : undefined;
  const fileName = req.file ? req.file.originalname : undefined;

  const record = await LabResult.create({
    patient: patientId,
    familyMember: familyMemberId || undefined,
    orderedBy: req.user._id,
    test,
    results,
    date: date || Date.now(),
    status: status || "completed",
    fileUrl,
    fileName,
  });

  res.status(201).json({ success: true, labResult: record });
});

module.exports = {
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
};

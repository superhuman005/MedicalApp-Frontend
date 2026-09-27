const mongoose = require("mongoose");
const { DURATIONS, PREGNANCY } = require("../../utils/questionnaire");

// Pre-consultation intake questionnaire. Embedded in ConsultationRequest and
// Appointment (the request's copy is carried onto the appointment when a
// doctor accepts). Not marked required at the schema level so records created
// before this feature existed still load; the controllers enforce it for new
// requests/bookings via parseQuestionnaire().
const questionnaireSchema = new mongoose.Schema(
  {
    chiefComplaint: { type: String, trim: true, maxlength: 500 },
    symptoms: [{ type: String, trim: true }],
    otherSymptoms: { type: String, trim: true, maxlength: 500 },
    symptomDuration: { type: String, enum: DURATIONS },
    severity: { type: Number, min: 1, max: 10 },
    medicalConditions: [{ type: String, trim: true }],
    currentMedications: { type: String, trim: true, maxlength: 500 },
    allergies: { type: String, trim: true, maxlength: 500 },
    isPregnant: { type: String, enum: PREGNANCY, default: "not-applicable" },
    previousTreatment: { type: String, trim: true, maxlength: 500 },
    additionalInfo: { type: String, trim: true, maxlength: 1000 },
    confirmedAccurate: { type: Boolean, default: false },
    submittedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

module.exports = questionnaireSchema;

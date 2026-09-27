const ApiError = require("./ApiError");

// Single source of truth for the intake questionnaire options. The frontend
// mirrors these lists in src/lib/questionnaire.ts - keep the two in sync.
const SYMPTOMS = [
  "Fever",
  "Cough",
  "Headache",
  "Fatigue",
  "Nausea or vomiting",
  "Diarrhea",
  "Shortness of breath",
  "Chest pain",
  "Sore throat",
  "Body aches",
  "Skin rash",
  "Dizziness",
  "Abdominal pain",
];

const DURATIONS = ["less-than-24h", "1-3-days", "4-7-days", "1-4-weeks", "over-1-month"];

const CONDITIONS = [
  "Diabetes",
  "Hypertension",
  "Asthma",
  "Heart disease",
  "Sickle cell disease",
  "Kidney disease",
  "HIV",
  "Cancer",
  "None of the above",
];

const PREGNANCY = ["yes", "no", "not-applicable"];

const cleanText = (value, max) => {
  if (value === undefined || value === null) return undefined;
  const text = String(value).trim();
  return text ? text.slice(0, max) : undefined;
};

// Only pick from the allowed list, so arbitrary strings can't be stored.
const pickAllowed = (value, allowed) => {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.filter((v) => allowed.includes(v)))];
};

/**
 * Validates and normalises a questionnaire submitted by a patient. Returns a
 * clean object containing only known fields (never the raw request body).
 * Throws a 400 ApiError describing the first problem found.
 */
const parseQuestionnaire = (raw) => {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    throw new ApiError(400, "Please complete the health questionnaire before continuing");
  }

  const chiefComplaint = cleanText(raw.chiefComplaint, 500);
  if (!chiefComplaint) {
    throw new ApiError(400, "Questionnaire: please describe your main concern");
  }

  if (!DURATIONS.includes(raw.symptomDuration)) {
    throw new ApiError(400, "Questionnaire: please tell us how long you've had these symptoms");
  }

  const severity = Number(raw.severity);
  if (!Number.isInteger(severity) || severity < 1 || severity > 10) {
    throw new ApiError(400, "Questionnaire: severity must be a whole number from 1 to 10");
  }

  const pregnancy = raw.isPregnant === undefined || raw.isPregnant === "" ? "not-applicable" : raw.isPregnant;
  if (!PREGNANCY.includes(pregnancy)) {
    throw new ApiError(400, "Questionnaire: invalid pregnancy answer");
  }

  if (raw.confirmedAccurate !== true) {
    throw new ApiError(400, "Questionnaire: please confirm the information you provided is accurate");
  }

  return {
    chiefComplaint,
    symptoms: pickAllowed(raw.symptoms, SYMPTOMS),
    otherSymptoms: cleanText(raw.otherSymptoms, 500),
    symptomDuration: raw.symptomDuration,
    severity,
    medicalConditions: pickAllowed(raw.medicalConditions, CONDITIONS),
    currentMedications: cleanText(raw.currentMedications, 500),
    allergies: cleanText(raw.allergies, 500),
    isPregnant: pregnancy,
    previousTreatment: cleanText(raw.previousTreatment, 500),
    additionalInfo: cleanText(raw.additionalInfo, 1000),
    confirmedAccurate: true,
    submittedAt: new Date(),
  };
};

module.exports = { parseQuestionnaire, SYMPTOMS, DURATIONS, CONDITIONS, PREGNANCY };

import type { Questionnaire } from "@/types";

// Mirrors the option lists in the backend's src/utils/questionnaire.js.
// Keep the two in sync - the server rejects values that aren't in these lists.
export const SYMPTOM_OPTIONS = [
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
] as const;

export const DURATION_OPTIONS: { value: Questionnaire["symptomDuration"]; label: string }[] = [
  { value: "less-than-24h", label: "Less than 24 hours" },
  { value: "1-3-days", label: "1–3 days" },
  { value: "4-7-days", label: "4–7 days" },
  { value: "1-4-weeks", label: "1–4 weeks" },
  { value: "over-1-month", label: "Over 1 month" },
];

export const CONDITION_OPTIONS = [
  "Diabetes",
  "Hypertension",
  "Asthma",
  "Heart disease",
  "Sickle cell disease",
  "Kidney disease",
  "HIV",
  "Cancer",
  "None of the above",
] as const;

export const PREGNANCY_OPTIONS: { value: Questionnaire["isPregnant"]; label: string }[] = [
  { value: "not-applicable", label: "Not applicable" },
  { value: "no", label: "No" },
  { value: "yes", label: "Yes" },
];

export const durationLabel = (value?: string) =>
  DURATION_OPTIONS.find((d) => d.value === value)?.label ?? value ?? "—";

export const pregnancyLabel = (value?: string) =>
  PREGNANCY_OPTIONS.find((p) => p.value === value)?.label ?? value ?? "—";

// What the patient fills in. severity is null until they pick a value so an
// untouched form can't be mistaken for a real answer.
export interface QuestionnaireDraft {
  chiefComplaint: string;
  symptoms: string[];
  otherSymptoms: string;
  symptomDuration: Questionnaire["symptomDuration"] | "";
  severity: number | null;
  medicalConditions: string[];
  currentMedications: string;
  allergies: string;
  isPregnant: Questionnaire["isPregnant"];
  previousTreatment: string;
  additionalInfo: string;
  confirmedAccurate: boolean;
}

export const emptyQuestionnaire = (): QuestionnaireDraft => ({
  chiefComplaint: "",
  symptoms: [],
  otherSymptoms: "",
  symptomDuration: "",
  severity: null,
  medicalConditions: [],
  currentMedications: "",
  allergies: "",
  isPregnant: "not-applicable",
  previousTreatment: "",
  additionalInfo: "",
  confirmedAccurate: false,
});

// Returns the first thing the patient still needs to fill in, or null if the
// questionnaire is ready to submit. Matches the server-side checks.
export const getQuestionnaireError = (q: QuestionnaireDraft): string | null => {
  if (!q.chiefComplaint.trim()) return "Please describe your main concern";
  if (!q.symptomDuration) return "Please tell us how long you've had these symptoms";
  if (q.severity === null) return "Please rate how severe your symptoms are";
  if (!q.confirmedAccurate) return "Please confirm your answers are accurate";
  return null;
};

export const isQuestionnaireComplete = (q: QuestionnaireDraft) => getQuestionnaireError(q) === null;

// Shape sent to the API
export const toQuestionnairePayload = (q: QuestionnaireDraft) => ({
  ...q,
  chiefComplaint: q.chiefComplaint.trim(),
});

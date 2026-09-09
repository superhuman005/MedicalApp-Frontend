import API from "./api";
import type { ConsultationRecord, Prescription, VitalSign, LabResult } from "@/types";

// Both patients and doctors scope requests with either familyMemberId (patient
// view of a dependent) or patientId (doctor view of any patient), matching the
// backend's resolveScope() logic in medicalRecordController.
export interface RecordsScopeParams {
  familyMemberId?: string;
  patientId?: string;
}

export const getConsultations = async (params: RecordsScopeParams): Promise<ConsultationRecord[]> => {
  const { data } = await API.get("/medical-records/consultations", { params });
  return data.consultations;
};

export interface CreateConsultationInput {
  patientId: string;
  familyMemberId?: string;
  appointmentId?: string;
  date?: string;
  specialty?: string;
  diagnosis?: string;
  prescription?: string;
  notes?: string;
  status?: "completed" | "follow-up-required" | "cancelled";
}

export const createConsultation = async (input: CreateConsultationInput): Promise<ConsultationRecord> => {
  const { data } = await API.post("/medical-records/consultations", input);
  return data.consultation;
};

export const getPrescriptions = async (params: RecordsScopeParams): Promise<Prescription[]> => {
  const { data } = await API.get("/medical-records/prescriptions", { params });
  return data.prescriptions;
};

export interface CreatePrescriptionInput {
  patientId: string;
  familyMemberId?: string;
  consultationId?: string;
  medication: string;
  dosage?: string;
  instructions?: string;
  date?: string;
  refills?: number;
}

export const createPrescription = async (input: CreatePrescriptionInput): Promise<Prescription> => {
  const { data } = await API.post("/medical-records/prescriptions", input);
  return data.prescription;
};

export const updatePrescriptionStatus = async (
  id: string,
  status: Prescription["status"]
): Promise<Prescription> => {
  const { data } = await API.patch(`/medical-records/prescriptions/${id}/status`, { status });
  return data.prescription;
};

export const getVitals = async (params: RecordsScopeParams): Promise<VitalSign[]> => {
  const { data } = await API.get("/medical-records/vitals", { params });
  return data.vitals;
};

export interface CreateVitalInput {
  patientId?: string; // required if a doctor is logging on behalf of a patient
  familyMemberId?: string;
  date?: string;
  bloodPressure?: string;
  heartRate?: string;
  temperature?: string;
  weight?: string;
  height?: string;
  oxygenSaturation?: string;
}

export const createVital = async (input: CreateVitalInput): Promise<VitalSign> => {
  const { data } = await API.post("/medical-records/vitals", input);
  return data.vital;
};

export const getLabResults = async (params: RecordsScopeParams): Promise<LabResult[]> => {
  const { data } = await API.get("/medical-records/labs", { params });
  return data.labResults;
};

export interface CreateLabResultInput {
  patientId: string;
  familyMemberId?: string;
  test: string;
  results?: string;
  date?: string;
  status?: LabResult["status"];
  file?: File;
}

export const createLabResult = async (input: CreateLabResultInput): Promise<LabResult> => {
  const formData = new FormData();
  formData.append("patientId", input.patientId);
  if (input.familyMemberId) formData.append("familyMemberId", input.familyMemberId);
  formData.append("test", input.test);
  if (input.results) formData.append("results", input.results);
  if (input.date) formData.append("date", input.date);
  if (input.status) formData.append("status", input.status);
  if (input.file) formData.append("file", input.file);

  const { data } = await API.post("/medical-records/labs", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data.labResult;
};

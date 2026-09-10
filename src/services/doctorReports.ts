import API from "./api";
import type { DoctorReportItem } from "@/types";

export interface CreateDoctorReportInput {
  appointmentId: string;
  recommendation: string;
  urgency?: "low" | "medium" | "high";
}

export const createDoctorReport = async (input: CreateDoctorReportInput): Promise<DoctorReportItem> => {
  const { data } = await API.post("/doctor-reports", input);
  return data.report;
};

export const getMyDoctorReports = async (): Promise<DoctorReportItem[]> => {
  const { data } = await API.get("/doctor-reports/mine");
  return data.reports;
};

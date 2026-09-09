import API from "./api";
import type { ConsultationRequestItem, ConsultationRequestStatus, Appointment } from "@/types";

export interface CreateConsultationRequestInput {
  type: "video" | "chat";
  urgency?: "low" | "medium" | "high";
  message?: string;
  familyMemberId?: string;
  doctorId?: string;
}

export const createConsultationRequest = async (
  input: CreateConsultationRequestInput
): Promise<ConsultationRequestItem> => {
  const { data } = await API.post("/consultation-requests", input);
  return data.request;
};

export const getConsultationRequests = async (
  params: { status?: ConsultationRequestStatus } = {}
): Promise<ConsultationRequestItem[]> => {
  const { data } = await API.get("/consultation-requests", { params });
  return data.requests;
};

export const acceptConsultationRequest = async (
  id: string
): Promise<{ request: ConsultationRequestItem; appointment: Appointment }> => {
  const { data } = await API.patch(`/consultation-requests/${id}/accept`);
  return { request: data.request, appointment: data.appointment };
};

export const declineConsultationRequest = async (id: string): Promise<void> => {
  await API.patch(`/consultation-requests/${id}/decline`);
};

export const cancelConsultationRequest = async (id: string): Promise<void> => {
  await API.patch(`/consultation-requests/${id}/cancel`);
};

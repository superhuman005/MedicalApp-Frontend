import API from "./api";
import type { Appointment, AppointmentStatus } from "@/types";

export interface BookAppointmentInput {
  doctorId: string;
  familyMemberId?: string;
  date: string;
  time: string;
  type: "video" | "chat";
  appointmentType?: string;
  reason?: string;
}

export const bookAppointment = async (input: BookAppointmentInput): Promise<Appointment> => {
  const { data } = await API.post("/appointments", input);
  return data.appointment;
};

export interface GetAppointmentsParams {
  status?: AppointmentStatus;
  upcoming?: boolean;
}

export const getMyAppointments = async (params: GetAppointmentsParams = {}): Promise<Appointment[]> => {
  const { data } = await API.get("/appointments", { params });
  return data.appointments;
};

export const getAppointmentById = async (id: string): Promise<Appointment> => {
  const { data } = await API.get(`/appointments/${id}`);
  return data.appointment;
};

export const updateAppointmentStatus = async (
  id: string,
  status: AppointmentStatus
): Promise<Appointment> => {
  const { data } = await API.patch(`/appointments/${id}/status`, { status });
  return data.appointment;
};

export const cancelAppointment = async (id: string, reason?: string): Promise<void> => {
  await API.delete(`/appointments/${id}`, { data: { reason } });
};

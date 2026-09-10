import API from "./api";
import type { AdminOverview, User, Appointment, DoctorReportItem, Payment } from "@/types";

export const getAdminOverview = async (): Promise<AdminOverview> => {
  const { data } = await API.get("/admin/overview");
  return data.overview;
};

export const getUsers = async (params: { role?: string; search?: string } = {}): Promise<User[]> => {
  const { data } = await API.get("/admin/users", { params });
  return data.users;
};

export const getPendingDoctors = async (): Promise<User[]> => {
  const { data } = await API.get("/admin/doctors/pending");
  return data.doctors;
};

export const getAllDoctors = async (status?: string): Promise<User[]> => {
  const { data } = await API.get("/admin/doctors", { params: { status } });
  return data.doctors;
};

export const approveDoctor = async (id: string): Promise<User> => {
  const { data } = await API.patch(`/admin/doctors/${id}/approve`);
  return data.doctor;
};

export const rejectDoctor = async (id: string, note?: string): Promise<User> => {
  const { data } = await API.patch(`/admin/doctors/${id}/reject`, { note });
  return data.doctor;
};

export const getAllAppointments = async (status?: string): Promise<Appointment[]> => {
  const { data } = await API.get("/admin/appointments", { params: { status } });
  return data.appointments;
};

export const getAdminDoctorReports = async (status?: string): Promise<DoctorReportItem[]> => {
  const { data } = await API.get("/admin/doctor-reports", { params: { status } });
  return data.reports;
};

export const markDoctorReportReviewed = async (id: string): Promise<DoctorReportItem> => {
  const { data } = await API.patch(`/admin/doctor-reports/${id}/review`);
  return data.report;
};

export const getAllPayments = async (): Promise<Payment[]> => {
  const { data } = await API.get("/admin/payments");
  return data.payments;
};

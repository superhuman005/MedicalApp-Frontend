import API from "./api";
import type { AdminOverview, User, Appointment, DoctorReportItem, Payment, AdminPrescription, AdminPlan, AdminReviewItem } from "@/types";

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

// Every patient review of every doctor, platform-wide - a doctor's own
// dashboard only ever shows their own accumulated average (see
// user.rating/ratingCount); this is the full underlying detail, admin-only.
export const getAllReviews = async (
  doctorId?: string
): Promise<{ reviews: AdminReviewItem[]; averageRating: number; count: number }> => {
  const { data } = await API.get("/admin/reviews", { params: { doctorId } });
  return { reviews: data.reviews, averageRating: data.averageRating, count: data.count };
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

export const getAdminPrescriptions = async (
  status?: "pending" | "fulfilled" | "rejected"
): Promise<AdminPrescription[]> => {
  const { data } = await API.get("/admin/prescriptions", { params: { status } });
  return data.prescriptions;
};

export const updateAdminPrescriptionStatus = async (
  id: string,
  status: "fulfilled" | "rejected",
  note?: string
): Promise<AdminPrescription> => {
  const { data } = await API.patch(`/admin/prescriptions/${id}/status`, { status, note });
  return data.prescription;
};

export const getAdmins = async (): Promise<User[]> => {
  const { data } = await API.get("/admin/admins");
  return data.admins;
};

// No pricing field - doctors have no pricing controls anywhere in the app.
// This is a subscription-only platform; see the plan management functions
// below for the only place prices can be set.
export interface CreateDoctorInput {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  password?: string; // leave blank to have the server generate a temporary one
  specialization: string;
  medicalLicenseNumber: string;
  yearsOfExperience: number;
  bio?: string;
  gender?: "male" | "female" | "other" | "";
  dateOfBirth?: string;
}

// The only way to create a doctor account now - there is no public doctor
// signup. The account is created already approved.
export const createDoctor = async (
  input: CreateDoctorInput
): Promise<{ doctor: User; temporaryPassword?: string }> => {
  const { data } = await API.post("/admin/doctors", input);
  return { doctor: data.doctor, temporaryPassword: data.temporaryPassword };
};

export interface CreateAdminInput {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  password?: string; // leave blank to have the server generate a temporary one
}

export const createAdmin = async (
  input: CreateAdminInput
): Promise<{ admin: User; temporaryPassword?: string }> => {
  const { data } = await API.post("/admin/admins", input);
  return { admin: data.admin, temporaryPassword: data.temporaryPassword };
};

// --- Subscription plans ---------------------------------------------------
// The only place prices are set anywhere in the app. Doctors have no
// pricing controls; any admin can create a plan or change a price here.

export const getAdminPlans = async (): Promise<AdminPlan[]> => {
  const { data } = await API.get("/admin/plans");
  return data.plans;
};

export interface PlanInput {
  planId?: string; // required on create; ignored/rejected on update
  name: string;
  price: number; // NGN
  period?: string;
  familyMemberLimit: number;
  videoConsultationsLimit?: number; // -1 = unlimited
  chatConsultationsLimit?: number; // -1 = unlimited
  features?: string[];
  isFeatured?: boolean;
  isActive?: boolean;
  isDefault?: boolean;
  sortOrder?: number;
}

export const createPlan = async (input: PlanInput): Promise<AdminPlan> => {
  const { data } = await API.post("/admin/plans", input);
  return data.plan;
};

export const updatePlan = async (id: string, input: Partial<PlanInput>): Promise<AdminPlan> => {
  const { data } = await API.patch(`/admin/plans/${id}`, input);
  return data.plan;
};

export const deletePlan = async (id: string): Promise<void> => {
  await API.delete(`/admin/plans/${id}`);
};

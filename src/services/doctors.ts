import API from "./api";
import type { User, DoctorStatus } from "@/types";

export interface GetDoctorsParams {
  specialty?: string;
  status?: string;
  online?: boolean;
  search?: string;
}

export const getDoctors = async (params: GetDoctorsParams = {}): Promise<User[]> => {
  const { data } = await API.get("/doctors", { params });
  return data.doctors;
};

export const getDoctorById = async (id: string): Promise<User> => {
  const { data } = await API.get(`/doctors/${id}`);
  return data.doctor;
};

export const updateMyDoctorStatus = async (status: DoctorStatus): Promise<User> => {
  const { data } = await API.patch("/doctors/me/status", { status });
  return data.doctor;
};

export interface UpdateDoctorProfileInput {
  bio?: string;
  specialization?: string;
  yearsOfExperience?: number;
  consultationFee?: { video?: number; chat?: number };
  avatar?: string;
}

export const updateMyDoctorProfile = async (input: UpdateDoctorProfileInput): Promise<User> => {
  const { data } = await API.patch("/doctors/me/profile", input);
  return data.doctor;
};

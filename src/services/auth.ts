import API from "./api";
import type { User } from "@/types";

export interface RegisterInput {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  password: string;
  role: "patient" | "doctor";
  specialization?: string;
  medicalLicenseNumber?: string;
  yearsOfExperience?: number;
  bio?: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export const registerRequest = async (input: RegisterInput): Promise<AuthResponse> => {
  const { data } = await API.post("/auth/register", input);
  return { token: data.token, user: data.user };
};

export const loginRequest = async (
  email: string,
  password: string,
  role?: "patient" | "doctor" | "admin"
): Promise<AuthResponse> => {
  const { data } = await API.post("/auth/login", { email, password, role });
  return { token: data.token, user: data.user };
};

export const getMeRequest = async (): Promise<User> => {
  const { data } = await API.get("/auth/me");
  return data.user;
};

export const logoutRequest = async (): Promise<void> => {
  await API.post("/auth/logout");
};

export const updatePasswordRequest = async (
  currentPassword: string,
  newPassword: string
): Promise<string> => {
  const { data } = await API.patch("/auth/update-password", { currentPassword, newPassword });
  return data.token;
};

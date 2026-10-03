import API from "./api";
import type { User } from "@/types";

export const getUserById = async (id: string): Promise<User> => {
  const { data } = await API.get(`/users/${id}`);
  return data.user;
};

// Fields common to both patients and doctors, editable from their own
// profile page. Doctor-only fields (bio, specialization, experience) go
// through services/doctors.ts's updateMyDoctorProfile instead.
export interface UpdateMeInput {
  firstName?: string;
  lastName?: string;
  phone?: string;
  avatar?: string;
  dateOfBirth?: string;
  gender?: "male" | "female" | "other" | "";
}

export const updateMe = async (input: UpdateMeInput): Promise<User> => {
  const { data } = await API.patch("/users/me", input);
  return data.user;
};

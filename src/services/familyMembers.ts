import API from "./api";
import type { FamilyMember } from "@/types";

export const getFamilyMembers = async (): Promise<FamilyMember[]> => {
  const { data } = await API.get("/patients");
  return data.patients;
};

export interface FamilyMemberInput {
  name: string;
  relationship: string;
  age?: number;
  dateOfBirth?: string;
  gender?: string;
  avatar?: string;
}

export const addFamilyMember = async (input: FamilyMemberInput): Promise<FamilyMember> => {
  const { data } = await API.post("/patients", input);
  return data.patient;
};

export const updateFamilyMember = async (
  id: string,
  input: Partial<FamilyMemberInput>
): Promise<FamilyMember> => {
  const { data } = await API.patch(`/patients/${id}`, input);
  return data.patient;
};

export const deleteFamilyMember = async (id: string): Promise<void> => {
  await API.delete(`/patients/${id}`);
};

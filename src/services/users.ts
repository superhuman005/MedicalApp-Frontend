import API from "./api";
import type { User } from "@/types";

export const getUserById = async (id: string): Promise<User> => {
  const { data } = await API.get(`/users/${id}`);
  return data.user;
};

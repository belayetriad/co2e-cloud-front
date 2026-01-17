import API from "@/lib/axios";
import { LoginPayload, LoginResponse } from "@/types/auth";

export const loginRequest = async (payload: LoginPayload) => {
  const { data } = await API.post<LoginResponse>("/auth/login", payload);
  return data;
};

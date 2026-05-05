import { request } from "./http";

export type UserRole = "ADMIN" | "MANAGER" | "USER" | "READONLY";

export type User = {
  id: number;
  email: string;
  fullName: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type LoginResponse = {
  token: string;
  user: User;
};

export const loginRequest = (email: string, password: string) => {
  return request<LoginResponse>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
};

export const logoutRequest = () => {
  return request<void>("/api/auth/logout", { method: "POST" });
};

export const meRequest = () => {
  return request<{ user: User }>("/api/auth/me");
};

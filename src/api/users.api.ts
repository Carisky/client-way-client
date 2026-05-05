import type { User, UserRole } from "./auth.api";
import { request } from "./http";

export type CreateUserPayload = {
  email: string;
  password: string;
  fullName: string;
  role: UserRole;
};

export const listUsersRequest = () => {
  return request<{ users: User[] }>("/api/users");
};

export const createUserRequest = (payload: CreateUserPayload) => {
  return request<{ user: User }>("/api/users", {
    method: "POST",
    body: JSON.stringify(payload),
  });
};

export const deactivateUserRequest = (id: number) => {
  return request<{ user: User }>(`/api/users/${id}/deactivate`, { method: "POST" });
};

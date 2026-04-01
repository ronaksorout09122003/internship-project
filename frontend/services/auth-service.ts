import { apiClient } from "@/services/api-client";
import type { AuthResponse, RegisterPayload, UpdateProfilePayload, User } from "@/types/auth";

export async function register(payload: RegisterPayload) {
  const { data } = await apiClient.post<AuthResponse>("/auth/register", payload);
  return data;
}

export async function login(payload: { email: string; password: string }) {
  const { data } = await apiClient.post<AuthResponse>("/auth/login", payload);
  return data;
}

export async function getCurrentUser() {
  const { data } = await apiClient.get<User>("/users/me");
  return data;
}

export async function updateCurrentUser(payload: UpdateProfilePayload) {
  const { data } = await apiClient.put<User>("/users/me", payload);
  return data;
}

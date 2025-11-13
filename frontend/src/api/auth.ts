import { api } from "./client";
import type { User } from "../types";

interface AuthResponse {
  token: string;
  user: User;
}

export async function login(payload: { login: string; password: string }) {
  const { data } = await api.post<AuthResponse>("/auth/login", payload);
  return data;
}

export async function register(payload: {
  name: string;
  phone: string;
  vehicle: string;
  email: string;
  password: string;
}) {
  const { data } = await api.post<AuthResponse>("/auth/register", payload);
  return data;
}

export async function fetchCurrentUser() {
  const { data } = await api.get<User>("/auth/me");
  return data;
}



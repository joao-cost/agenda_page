import { api } from "./client";
import type { Service } from "../types";

export async function listServices() {
  const { data } = await api.get<Service[]>("/services");
  return data;
}

export async function createService(payload: {
  name: string;
  description?: string;
  price: number;
  durationMin: number;
}) {
  const { data } = await api.post<Service>("/services", payload);
  return data;
}

export async function updateService(id: string, payload: Partial<Service>) {
  const { data } = await api.put<Service>(`/services/${id}`, payload);
  return data;
}

export async function deleteService(id: string) {
  await api.delete(`/services/${id}`);
}



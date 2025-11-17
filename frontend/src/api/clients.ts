import { api } from "./client";
import type { Client } from "../types";

export async function listClients() {
  const { data } = await api.get<Client[]>("/clients");
  return data;
}

export async function createClient(payload: {
  name: string;
  phone: string;
  vehicle: string;
  plate?: string;
  notes?: string;
}) {
  const { data } = await api.post<Client>("/clients", payload);
  return data;
}

export async function updateClient(id: string, payload: Partial<Client>) {
  const { data } = await api.put<Client>(`/clients/${id}`, payload);
  return data;
}



import { api } from "./client";

export interface EvolutionSettings {
  domain: string;
  token: string;
  session?: string;
}

export interface Washer {
  id: string;
  name: string;
}

export interface GeneralSettings {
  id: string;
  multiWasher: boolean;
  workStartHour: number;
  workEndHour: number;
  workDays: string;
  closedDates: string[];
  maxConcurrentBookings: number;
  washers: Washer[];
  adminPhone?: string;
}

export async function fetchGeneralSettings() {
  const { data } = await api.get<GeneralSettings>("/settings/general");
  return data;
}

export async function updateGeneralSettings(payload: Partial<GeneralSettings>) {
  const { data } = await api.put<GeneralSettings>("/settings/general", payload);
  return data;
}

export async function fetchEvolutionSettings() {
  const { data } = await api.get<EvolutionSettings>("/settings/evolution");
  return data;
}

export async function updateEvolutionSettings(payload: EvolutionSettings) {
  const { data } = await api.put("/settings/evolution", payload);
  return data;
}




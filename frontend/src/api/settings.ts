import { api } from "./client";

export interface EvolutionSettings {
  domain: string;
  token: string;
  session?: string;
}

export async function fetchEvolutionSettings() {
  const { data } = await api.get<EvolutionSettings>("/settings/evolution");
  return data;
}

export async function updateEvolutionSettings(payload: EvolutionSettings) {
  const { data } = await api.put("/settings/evolution", payload);
  return data;
}




import { api } from "./client";

export interface RevenueSummary {
  date: string;
  total: number;
  appointments: number;
  paid: number;
  pending: number;
}

export async function fetchDailyRevenue(date: string) {
  const { data } = await api.get<RevenueSummary>("/reports/daily", { params: { date } });
  return data;
}

export async function fetchMonthlyRevenue(month: string) {
  const { data } = await api.get<RevenueSummary>("/reports/monthly", { params: { month } });
  return data;
}



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

export interface PendingPayment {
  id: string;
  date: string;
  clientName: string;
  clientPhone: string;
  serviceName: string;
  amount: number;
  paymentId: string;
}

export interface PendingPaymentsResponse {
  appointments: PendingPayment[];
  total: number;
  count: number;
}

export async function fetchPendingPayments() {
  const { data } = await api.get<PendingPaymentsResponse>("/reports/pending");
  return data;
}



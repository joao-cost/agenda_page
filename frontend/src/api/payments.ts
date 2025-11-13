import { api } from "./client";
import type { Payment } from "../types";

export async function updatePaymentStatus(id: string, status: "PENDENTE" | "PAGO") {
  const { data } = await api.patch<Payment>(`/payments/${id}/status`, { status });
  return data;
}




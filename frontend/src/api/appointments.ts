import { api } from "./client";
import type { Appointment, AppointmentStatus } from "../types";

export async function createAppointment(payload: {
  serviceId: string;
  clientId: string;
  date: string;
  notes?: string;
}) {
  const { data } = await api.post<Appointment>("/appointments", payload);
  return data;
}

export interface ListAppointmentsParams {
  date?: string;
  start?: string;
  end?: string;
}

export async function listAppointments(params?: ListAppointmentsParams) {
  const { data } = await api.get<Appointment[]>("/appointments", { params });
  return data;
}

export async function updateAppointmentStatus(id: string, status: AppointmentStatus) {
  const { data } = await api.patch<Appointment>(`/appointments/${id}/status`, { status });
  return data;
}

export interface AvailabilityResponse {
  date: string;
  serviceId: string;
  serviceDuration: number;
  workingHours: {
    start: string;
    end: string;
  };
  availableSlots: string[];
}

export async function fetchAvailability(params: { serviceId: string; date: string }) {
  const { data } = await api.get<AvailabilityResponse>("/appointments/availability", { params });
  return data;
}



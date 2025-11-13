export type UserRole = "ADMIN" | "CLIENT";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  clientId?: string;
  token?: string;
}

export interface Client {
  id: string;
  name: string;
  phone: string;
  vehicle: string;
  notes?: string;
  createdAt: string;
}

export interface Service {
  id: string;
  name: string;
  description?: string;
  price: number;
  durationMin: number;
}

export type AppointmentStatus = "AGENDADO" | "LAVANDO" | "ENTREGUE" | "CANCELADO";

export interface Payment {
  id: string;
  status: "PENDENTE" | "PAGO";
  amount: number;
  paidAt?: string;
}

export interface Appointment {
  id: string;
  date: string;
  status: AppointmentStatus;
  notes?: string;
  client: Client;
  service: Service;
  payment?: Payment;
}


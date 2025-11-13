import { z } from "zod";

export const createAppointmentSchema = z.object({
  serviceId: z.string().cuid(),
  clientId: z.string().cuid(),
  date: z.string().datetime({ offset: true }),
  notes: z.string().optional()
});

export const updateAppointmentStatusSchema = z.object({
  status: z.enum(["AGENDADO", "LAVANDO", "ENTREGUE", "CANCELADO"])
});

export const updateAppointmentSchema = z.object({
  serviceId: z.string().cuid().optional(),
  date: z.string().datetime({ offset: true }).optional(),
  notes: z.string().optional()
});

export const availabilityQuerySchema = z.object({
  serviceId: z.string().cuid(),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Data inválida. Use o formato YYYY-MM-DD.")
});



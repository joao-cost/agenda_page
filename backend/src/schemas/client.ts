import { z } from "zod";

export const createClientSchema = z.object({
  name: z.string().min(2),
  phone: z.string().min(10),
  vehicle: z.string().min(2),
  notes: z.string().optional()
});

export const updateClientSchema = createClientSchema.partial();



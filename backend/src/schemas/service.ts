import { z } from "zod";

export const upsertServiceSchema = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
  price: z.coerce.number().positive(),
  durationMin: z.number().int().positive()
});



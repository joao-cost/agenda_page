import { z } from "zod";

export const updatePaymentStatusSchema = z.object({
  status: z.enum(["PENDENTE", "PAGO"])
});




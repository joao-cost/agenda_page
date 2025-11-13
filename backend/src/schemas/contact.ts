import { z } from "zod";

export const contactFormSchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  phone: z.string().min(10, "Telefone inválido"),
  vehicle: z.string().min(2, "Informe o veículo"),
  message: z.string().optional()
});



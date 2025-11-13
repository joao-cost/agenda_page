import { z } from "zod";

export const loginSchema = z.object({
  login: z.string().email("Informe um e-mail válido."),
  password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres.")
});

export const registerSchema = z.object({
  name: z.string().min(2),
  phone: z.string().min(10),
  vehicle: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6)
});



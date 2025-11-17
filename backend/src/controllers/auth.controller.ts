import type { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { loginSchema, registerSchema } from "../schemas/auth";
import { comparePassword, hashPassword } from "../utils/password";
import { signJwt } from "../utils/jwt";

function mapUser(user: { id: string; name: string | null; login: string; role: string; clientId: string | null }) {
  return {
    id: user.id,
    name: user.name ?? user.login,
    email: user.login,
    role: user.role,
    clientId: user.clientId
  };
}

export const authController = {
  async register(req: Request, res: Response) {
    const parseResult = registerSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ message: parseResult.error.flatten() });
    }

    const { name, phone, vehicle, plate, email, password } = parseResult.data;

    const existingUser = await prisma.user.findUnique({ where: { login: email } });
    if (existingUser) {
      return res.status(400).json({ message: "E-mail já cadastrado." });
    }

    const hashedPassword = await hashPassword(password);

    const client = await prisma.client.create({
      data: {
        name,
        phone,
        vehicle,
        plate: plate || null
      }
    });

    const user = await prisma.user.create({
      data: {
        login: email,
        password: hashedPassword,
        name,
        role: "CLIENT",
        clientId: client.id
      }
    });

    const token = signJwt({ sub: user.id, role: user.role, clientId: client.id });

    return res.status(201).json({ token, user: mapUser(user) });
  },

  async login(req: Request, res: Response) {
    const parseResult = loginSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ message: parseResult.error.flatten() });
    }

    const { login, password } = parseResult.data;

    const user = await prisma.user.findUnique({ where: { login }, include: { client: true } });
    if (!user) {
      return res.status(401).json({ message: "Credenciais inválidas." });
    }

    const passwordMatches = await comparePassword(password, user.password);
    if (!passwordMatches) {
      return res.status(401).json({ message: "Credenciais inválidas." });
    }

    const token = signJwt({ sub: user.id, role: user.role, clientId: user.client?.id });

    return res.json({ token, user: mapUser(user) });
  },

  async me(req: Request, res: Response) {
    if (!req.user) {
      return res.status(401).json({ message: "Não autenticado." });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: { client: true }
    });

    if (!user) {
      return res.status(404).json({ message: "Usuário não encontrado." });
    }

    return res.json(mapUser(user));
  }
};



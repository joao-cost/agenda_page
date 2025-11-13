import type { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { createClientSchema, updateClientSchema } from "../schemas/client";

export const clientController = {
  async list(_req: Request, res: Response) {
    const clients = await prisma.client.findMany({
      orderBy: { createdAt: "desc" }
    });

    return res.json(
      clients.map((client) => ({
        ...client,
        createdAt: client.createdAt.toISOString(),
        updatedAt: client.updatedAt.toISOString()
      }))
    );
  },

  async create(req: Request, res: Response) {
    const parseResult = createClientSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ message: parseResult.error.flatten() });
    }

    const client = await prisma.client.create({
      data: parseResult.data
    });

    return res.status(201).json({
      ...client,
      createdAt: client.createdAt.toISOString(),
      updatedAt: client.updatedAt.toISOString()
    });
  },

  async update(req: Request, res: Response) {
    const { id } = req.params;
    const parseResult = updateClientSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ message: parseResult.error.flatten() });
    }

    const existing = await prisma.client.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ message: "Cliente não encontrado." });
    }

    const client = await prisma.client.update({
      where: { id },
      data: parseResult.data
    });

    return res.json({
      ...client,
      createdAt: client.createdAt.toISOString(),
      updatedAt: client.updatedAt.toISOString()
    });
  }
};



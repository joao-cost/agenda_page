import type { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { upsertServiceSchema } from "../schemas/service";

function serializeService(service: any) {
  return {
    ...service,
    price: Number(service.price),
    createdAt: service.createdAt.toISOString(),
    updatedAt: service.updatedAt.toISOString()
  };
}

export const serviceController = {
  async list(_req: Request, res: Response) {
    const services = await prisma.service.findMany({
      orderBy: { createdAt: "asc" }
    });
    return res.json(services.map(serializeService));
  },

  async create(req: Request, res: Response) {
    const parseResult = upsertServiceSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ message: parseResult.error.flatten() });
    }

    const service = await prisma.service.create({
      data: parseResult.data
    });

    return res.status(201).json(serializeService(service));
  },

  async update(req: Request, res: Response) {
    const { id } = req.params;
    const parseResult = upsertServiceSchema.partial().safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ message: parseResult.error.flatten() });
    }

    const existing = await prisma.service.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ message: "Serviço não encontrado." });
    }

    const service = await prisma.service.update({
      where: { id },
      data: parseResult.data
    });

    return res.json(serializeService(service));
  },

  async remove(req: Request, res: Response) {
    const { id } = req.params;
    await prisma.service.delete({ where: { id } });
    return res.status(204).send();
  }
};



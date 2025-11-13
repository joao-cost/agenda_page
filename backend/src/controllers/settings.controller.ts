import type { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { EVOLUTION_KEYS, clearEvolutionSettingsCache } from "../services/settings.service";

export const settingsController = {
  async getEvolution(req: Request, res: Response) {
    const keys = await prisma.integrationSetting.findMany({
      where: {
        key: {
          in: Object.values(EVOLUTION_KEYS)
        }
      }
    });

    const response = {
      domain: keys.find((item) => item.key === EVOLUTION_KEYS.domain)?.value ?? "",
      token: keys.find((item) => item.key === EVOLUTION_KEYS.token)?.value ?? "",
      session: keys.find((item) => item.key === EVOLUTION_KEYS.session)?.value ?? ""
    };

    return res.json(response);
  },

  async updateEvolution(req: Request, res: Response) {
    const { domain, token, session } = req.body as {
      domain?: string;
      token?: string;
      session?: string;
    };

    if (!domain || !token) {
      return res
        .status(400)
        .json({ message: "Informe ao menos domínio da API e token de autenticação." });
    }

    const entries = [
      { key: EVOLUTION_KEYS.domain, value: domain },
      { key: EVOLUTION_KEYS.token, value: token }
    ];

    if (session) {
      entries.push({ key: EVOLUTION_KEYS.session, value: session });
    }

    await Promise.all(
      entries.map((entry) =>
        prisma.integrationSetting.upsert({
          where: { key: entry.key },
          update: { value: entry.value },
          create: { key: entry.key, value: entry.value }
        })
      )
    );

    clearEvolutionSettingsCache();

    return res.json({ message: "Configurações atualizadas com sucesso." });
  }
};


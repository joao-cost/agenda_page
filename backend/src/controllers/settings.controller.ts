import type { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { EVOLUTION_KEYS, clearEvolutionSettingsCache } from "../services/settings.service";
import { z } from "zod";
import { isAfter, startOfDay } from "date-fns";
import { notifyCancellation } from "../services/whatsapp.service";

const generalSettingsSchema = z.object({
  multiWasher: z.boolean().optional(),
  workStartHour: z.number().int().min(0).max(23).optional(),
  workEndHour: z.number().int().min(0).max(23).optional(),
  workDays: z.string().optional(),
  closedDates: z.union([z.array(z.string()), z.string()]).optional(),
  maxConcurrentBookings: z.number().int().min(1).optional(),
  washers: z.union([
    z.array(z.object({ id: z.string(), name: z.string() })), 
    z.string()
  ]).optional(),
  adminPhone: z.union([z.string(), z.null()]).optional()
});

export const settingsController = {
  async getGeneral(req: Request, res: Response) {
    let settings = await prisma.generalSettings.findUnique({
      where: { id: "default" }
    });

    if (!settings) {
      settings = await prisma.generalSettings.create({
        data: {
          id: "default",
          multiWasher: false,
          workStartHour: 8,
          workEndHour: 18,
          workDays: "1,2,3,4,5,6",
          maxConcurrentBookings: 1
        }
      });
    }

    return res.json({
      ...settings,
      closedDates: settings.closedDates ? JSON.parse(settings.closedDates) : [],
      washers: settings.washers ? JSON.parse(settings.washers) : []
    });
  },

  async updateGeneral(req: Request, res: Response) {
    // Log do payload recebido para debug
    console.log("[Settings] Payload recebido:", JSON.stringify(req.body, null, 2));
    
    const parseResult = generalSettingsSchema.safeParse(req.body);
    if (!parseResult.success) {
      console.error("[Settings] Erro de validação:", JSON.stringify(parseResult.error.flatten(), null, 2));
      return res.status(400).json({ 
        message: "Erro de validação", 
        errors: parseResult.error.flatten().fieldErrors 
      });
    }

    const data = parseResult.data;
    const updateData: any = {};

    if (data.multiWasher !== undefined) updateData.multiWasher = data.multiWasher;
    if (data.workStartHour !== undefined) updateData.workStartHour = data.workStartHour;
    if (data.workEndHour !== undefined) updateData.workEndHour = data.workEndHour;
    if (data.workDays !== undefined) updateData.workDays = data.workDays;
    if (data.maxConcurrentBookings !== undefined) updateData.maxConcurrentBookings = data.maxConcurrentBookings;
    if (data.adminPhone !== undefined) updateData.adminPhone = data.adminPhone || null;
    
    if (data.closedDates !== undefined) {
      if (Array.isArray(data.closedDates)) {
        // Se é array vazio, salvar como "[]"
        updateData.closedDates = data.closedDates.length > 0 ? JSON.stringify(data.closedDates) : "[]";
      } else if (typeof data.closedDates === 'string') {
        // Se já é string, validar se é JSON válido
        try {
          JSON.parse(data.closedDates);
          updateData.closedDates = data.closedDates;
        } catch {
          updateData.closedDates = "[]";
        }
      } else {
        updateData.closedDates = "[]";
      }
    }
    
    if (data.washers !== undefined) {
      if (Array.isArray(data.washers)) {
        updateData.washers = data.washers.length > 0 ? JSON.stringify(data.washers) : JSON.stringify([]);
      } else if (typeof data.washers === 'string') {
        // Se já é string, pode ser JSON válido ou string vazia
        try {
          JSON.parse(data.washers); // Validar se é JSON válido
          updateData.washers = data.washers;
        } catch {
          updateData.washers = JSON.stringify([]);
        }
      } else {
        updateData.washers = JSON.stringify([]);
      }
    }

    const existing = await prisma.generalSettings.findUnique({
      where: { id: "default" }
    });

    // Verificar se está desativando o multi-lavador (mudando de true para false)
    const isDeactivatingMultiWasher = existing?.multiWasher === true && data.multiWasher === false;

    if (isDeactivatingMultiWasher) {
      console.log("[Settings] Desativando multi-lavador. Processando agendamentos...");
      
      // Identificar o Lavador Principal (primeiro da lista)
      let mainWasherId: string | null = null;
      if (existing?.washers) {
        try {
          const washers = JSON.parse(existing.washers);
          if (Array.isArray(washers) && washers.length > 0) {
            mainWasherId = washers[0].id;
            console.log(`[Settings] Lavador Principal identificado: ${washers[0].name} (ID: ${mainWasherId})`);
          }
        } catch (e) {
          console.error("[Settings] Erro ao fazer parse de washers para identificar lavador principal:", e);
        }
      }

      // Buscar todos os agendamentos futuros que não são do Lavador Principal
      const now = startOfDay(new Date());
      const futureAppointments = await prisma.appointment.findMany({
        where: {
          date: {
            gte: now
          },
          status: {
            not: "CANCELADO"
          },
          ...(mainWasherId ? {
            OR: [
              { washerId: { not: mainWasherId } },
              { washerId: null }
            ]
          } : {
            washerId: {
              not: null
            }
          })
        },
        include: {
          client: true,
          service: true
        }
      });

      console.log(`[Settings] Encontrados ${futureAppointments.length} agendamentos futuros para cancelar`);

      // Cancelar agendamentos dos outros lavadores
      for (const appointment of futureAppointments) {
        try {
          await prisma.appointment.update({
            where: { id: appointment.id },
            data: { status: "CANCELADO" }
          });

          console.log(`[Settings] Agendamento ${appointment.id} cancelado (cliente: ${appointment.client.name})`);

          // Notificar o cliente sobre o cancelamento
          await notifyCancellation({
            clientName: appointment.client.name,
            phone: appointment.client.phone,
            serviceName: appointment.service.name,
            dateTime: appointment.date.toISOString()
          }).catch((error) => {
            console.error(`[Settings] Erro ao notificar cliente ${appointment.client.name} sobre cancelamento:`, error);
          });
        } catch (error) {
          console.error(`[Settings] Erro ao cancelar agendamento ${appointment.id}:`, error);
        }
      }

      // Remover washerId dos agendamentos do Lavador Principal (limpar referência)
      if (mainWasherId) {
        const mainWasherAppointments = await prisma.appointment.findMany({
          where: {
            date: {
              gte: now
            },
            status: {
              not: "CANCELADO"
            },
            washerId: mainWasherId
          }
        });

        console.log(`[Settings] Removendo referência de lavador de ${mainWasherAppointments.length} agendamentos do Lavador Principal`);

        await prisma.appointment.updateMany({
          where: {
            date: {
              gte: now
            },
            status: {
              not: "CANCELADO"
            },
            washerId: mainWasherId
          },
          data: {
            washerId: null
          }
        });
      }

      console.log(`[Settings] Multi-lavador desativado. ${futureAppointments.length} agendamento(s) cancelado(s).`);
    }

    const settings = existing
      ? await prisma.generalSettings.update({
          where: { id: "default" },
          data: updateData
        })
      : await prisma.generalSettings.create({
          data: {
            id: "default",
            multiWasher: data.multiWasher ?? false,
            workStartHour: data.workStartHour ?? 8,
            workEndHour: data.workEndHour ?? 18,
            workDays: data.workDays ?? "1,2,3,4,5,6",
            closedDates: updateData.closedDates,
            maxConcurrentBookings: data.maxConcurrentBookings ?? 1,
            washers: updateData.washers
          }
        });

    // Parse seguro dos campos JSON
    let closedDates: string[] = [];
    let washers: Array<{ id: string; name: string }> = [];
    
    try {
      if (settings.closedDates) {
        closedDates = JSON.parse(settings.closedDates);
      }
    } catch (e) {
      console.error("[Settings] Erro ao fazer parse de closedDates:", e);
    }
    
    try {
      if (settings.washers) {
        washers = JSON.parse(settings.washers);
      }
    } catch (e) {
      console.error("[Settings] Erro ao fazer parse de washers:", e);
    }

    return res.json({
      ...settings,
      closedDates,
      washers
    });
  },

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


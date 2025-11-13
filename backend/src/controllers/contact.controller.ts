import type { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { contactFormSchema } from "../schemas/contact";
import { sendWhatsAppNotification } from "../services/whatsapp.service";

export const contactController = {
  async create(req: Request, res: Response) {
    const parseResult = contactFormSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ message: parseResult.error.flatten() });
    }

    const { name, phone, vehicle, message } = parseResult.data;

    // Criar cliente pendente de aprovação
    const client = await prisma.client.create({
      data: {
        name,
        phone,
        vehicle,
        notes: message,
        approved: false
      }
    });

    // Enviar notificação para WhatsApp do admin
    const whatsappMessage = `🆕 *Novo Pré-Cadastro*\n\n` +
      `👤 *Nome:* ${name}\n` +
      `📞 *Telefone:* ${phone}\n` +
      `🚗 *Veículo:* ${vehicle}\n` +
      (message ? `💬 *Mensagem:* ${message}\n` : ``) +
      `\n⚠️ *Aguardando aprovação no painel*`;

    try {
      await sendWhatsAppNotification({
        messaging_product: "whatsapp",
        to: "5566992566750", // Telefone do admin (formato internacional)
        type: "text",
        text: {
          body: whatsappMessage
        }
      });
    } catch (error) {
      console.error("Erro ao enviar notificação WhatsApp:", error);
      // Não falha a requisição se o WhatsApp não funcionar
    }

    return res.status(201).json({
      message: "Pré-cadastro realizado com sucesso! Aguarde aprovação.",
      client: {
        id: client.id,
        name: client.name,
        phone: client.phone,
        vehicle: client.vehicle
      }
    });
  }
};


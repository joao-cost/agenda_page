import type { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { updatePaymentStatusSchema } from "../schemas/payment";
import { notifyPaymentStatusChange } from "../services/whatsapp.service";

export const paymentController = {
  async updateStatus(req: Request, res: Response) {
    const { id } = req.params;
    const parseResult = updatePaymentStatusSchema.safeParse(req.body);

    if (!parseResult.success) {
      return res.status(400).json({ message: parseResult.error.flatten() });
    }

    const payment = await prisma.payment.update({
      where: { id },
      data: {
        status: parseResult.data.status,
        paidAt: parseResult.data.status === "PAGO" ? new Date() : null
      },
      include: {
        appointment: {
          include: {
            client: true,
            service: true
          }
        }
      }
    });

    notifyPaymentStatusChange({
      clientName: payment.appointment.client.name,
      phone: payment.appointment.client.phone,
      serviceName: payment.appointment.service.name,
      dateTime: payment.appointment.date,
      status: payment.status
    }).catch((error) => console.error("Erro ao enviar notificação de pagamento:", error));

    return res.json(payment);
  }
};




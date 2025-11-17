import type { Request, Response } from "express";
import { prisma } from "../lib/prisma";

function toNumber(value: any) {
  return Number(value ?? 0);
}

export const reportController = {
  async pending(req: Request, res: Response) {
    const pendingAppointments = await prisma.appointment.findMany({
      where: {
        status: "ENTREGUE",
        payment: {
          status: "PENDENTE"
        }
      },
      include: {
        client: true,
        service: true,
        payment: true
      },
      orderBy: { date: "desc" }
    });

    const totalPending = pendingAppointments.reduce((sum, apt) => {
      return sum + Number(apt.payment?.amount || 0);
    }, 0);

    return res.json({
      appointments: pendingAppointments.map((apt) => ({
        id: apt.id,
        date: apt.date.toISOString(),
        clientName: apt.client.name,
        clientPhone: apt.client.phone,
        serviceName: apt.service.name,
        amount: Number(apt.payment?.amount || 0),
        paymentId: apt.payment?.id
      })),
      total: totalPending,
      count: pendingAppointments.length
    });
  },

  async daily(req: Request, res: Response) {
    const { date } = req.query;
    if (typeof date !== "string") {
      return res.status(400).json({ message: "Parâmetro 'date' é obrigatório (YYYY-MM-DD)." });
    }

    const selected = new Date(date);
    const start = new Date(selected);
    start.setHours(0, 0, 0, 0);
    const end = new Date(selected);
    end.setHours(23, 59, 59, 999);

    const [appointments, paidSummary, pendingSummary] = await Promise.all([
      prisma.appointment.count({
        where: {
          date: {
            gte: start,
            lte: end
          }
        }
      }),
      prisma.payment.aggregate({
        where: {
          status: "PAGO",
          appointment: {
            date: {
              gte: start,
              lte: end
            }
          }
        },
        _sum: { amount: true }
      }),
      prisma.payment.aggregate({
        where: {
          status: "PENDENTE",
          appointment: {
            date: {
              gte: start,
              lte: end
            }
          }
        },
        _sum: { amount: true }
      })
    ]);

    const totalPaid = toNumber(paidSummary._sum.amount);
    const pending = toNumber(pendingSummary._sum.amount);
    // Total arrecadado é apenas o que foi pago
    const total = totalPaid;

    return res.json({
      date,
      total,
      appointments,
      paid: totalPaid,
      pending
    });
  },

  async monthly(req: Request, res: Response) {
    const { month } = req.query;
    if (typeof month !== "string") {
      return res.status(400).json({ message: "Parâmetro 'month' é obrigatório (YYYY-MM)." });
    }

    const [year, monthIndex] = month.split("-").map(Number);
    if (!year || !monthIndex) {
      return res.status(400).json({ message: "Formato inválido para 'month'." });
    }

    const start = new Date(year, monthIndex - 1, 1, 0, 0, 0, 0);
    const end = new Date(year, monthIndex, 0, 23, 59, 59, 999);

    const [appointments, paidSummary, pendingSummary] = await Promise.all([
      prisma.appointment.count({
        where: {
          date: {
            gte: start,
            lte: end
          }
        }
      }),
      prisma.payment.aggregate({
        where: {
          status: "PAGO",
          appointment: {
            date: {
              gte: start,
              lte: end
            }
          }
        },
        _sum: { amount: true }
      }),
      prisma.payment.aggregate({
        where: {
          status: "PENDENTE",
          appointment: {
            date: {
              gte: start,
              lte: end
            }
          }
        },
        _sum: { amount: true }
      })
    ]);

    const totalPaid = toNumber(paidSummary._sum.amount);
    const pending = toNumber(pendingSummary._sum.amount);
    // Total arrecadado é apenas o que foi pago
    const total = totalPaid;

    return res.json({
      date: month,
      total,
      appointments,
      paid: totalPaid,
      pending
    });
  }
};


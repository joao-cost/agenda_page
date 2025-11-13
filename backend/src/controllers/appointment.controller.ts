import type { Request, Response } from "express";
import type { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma";
import {
  availabilityQuerySchema,
  createAppointmentSchema,
  updateAppointmentStatusSchema
} from "../schemas/appointment";
import { notifyNewAppointment, notifyStatusChange } from "../services/whatsapp.service";
import { addMinutes, endOfDay, format, isBefore, setHours, setMilliseconds, setMinutes, setSeconds, startOfDay } from "date-fns";
import ptBR from "date-fns/locale/pt-BR";

function serializeAppointment(appointment: any) {
  return {
    ...appointment,
    date: appointment.date.toISOString(),
    service: {
      ...appointment.service,
      price: Number(appointment.service.price)
    },
    payment: appointment.payment
      ? {
          ...appointment.payment,
          amount: Number(appointment.payment.amount),
          createdAt: appointment.payment.createdAt.toISOString(),
          updatedAt: appointment.payment.updatedAt.toISOString(),
          paidAt: appointment.payment.paidAt ? appointment.payment.paidAt.toISOString() : null
        }
      : null,
    createdAt: appointment.createdAt.toISOString(),
    updatedAt: appointment.updatedAt.toISOString()
  };
}

export const appointmentController = {
  async availability(req: Request, res: Response) {
    const parseResult = availabilityQuerySchema.safeParse(req.query);
    if (!parseResult.success) {
      return res.status(400).json({ message: parseResult.error.flatten() });
    }

    const { serviceId, date } = parseResult.data;

    const service = await prisma.service.findUnique({
      where: { id: serviceId }
    });

    if (!service) {
      return res.status(404).json({ message: "Serviço não encontrado." });
    }

    const selectedDate = new Date(`${date}T00:00:00`);
    const dayStart = startOfDay(selectedDate);
    const dayEnd = endOfDay(selectedDate);

    const workingStart = setHours(setMinutes(setSeconds(setMilliseconds(dayStart, 0), 0), 0), 8);
    const workingEnd = setHours(setMinutes(setSeconds(setMilliseconds(dayStart, 0), 0), 0), 18);

    const appointments = await prisma.appointment.findMany({
      where: {
        date: {
          gte: workingStart,
          lt: dayEnd
        }
      },
      include: {
        service: true
      }
    });

    const slotDuration = service.durationMin;
    const step = 30;
    const availableSlots: Date[] = [];

    let cursor = workingStart;
    while (isBefore(addMinutes(cursor, slotDuration - 1), workingEnd) || addMinutes(cursor, slotDuration).getTime() === workingEnd.getTime()) {
      const slotEnd = addMinutes(cursor, slotDuration);

      const overlaps = appointments.some((appointment) => {
        const apptStart = appointment.date;
        const apptEnd = addMinutes(apptStart, appointment.service.durationMin);
        return cursor < apptEnd && slotEnd > apptStart;
      });

      if (!overlaps && slotEnd <= workingEnd) {
        availableSlots.push(new Date(cursor));
      }

      cursor = addMinutes(cursor, step);
    }

    return res.json({
      date,
      serviceId,
      serviceDuration: slotDuration,
      workingHours: {
        start: workingStart.toISOString(),
        end: workingEnd.toISOString()
      },
      availableSlots: availableSlots.map((slot) => slot.toISOString())
    });
  },

  async list(req: Request, res: Response) {
    const { date, start, end } = req.query;
    const where: Prisma.AppointmentWhereInput = {};

    if (typeof date === "string" && date.length > 0) {
      const selected = new Date(date);
      const start = new Date(selected);
      start.setHours(0, 0, 0, 0);
      const end = new Date(selected);
      end.setHours(23, 59, 59, 999);
      where.date = {
        gte: start,
        lte: end
      };
    }

    if (typeof start === "string" || typeof end === "string") {
      const startDate = typeof start === "string" ? new Date(start) : undefined;
      const endDate = typeof end === "string" ? new Date(end) : undefined;

      if (!where.date) {
        where.date = {};
      }

      if (startDate && !Number.isNaN(startDate.getTime())) {
        where.date = { ...where.date, gte: startDate };
      }

      if (endDate && !Number.isNaN(endDate.getTime())) {
        where.date = { ...where.date, lte: endDate };
      }
    }

    if (req.user?.role === "CLIENT") {
      where.clientId = req.user.clientId ?? undefined;
    }

    const appointments = await prisma.appointment.findMany({
      where,
      include: {
        client: true,
        service: true,
        payment: true
      },
      orderBy: { date: "asc" }
    });

    return res.json(appointments.map(serializeAppointment));
  },

  async create(req: Request, res: Response) {
    const parseResult = createAppointmentSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ message: parseResult.error.flatten() });
    }

    const { clientId, serviceId, date, notes } = parseResult.data;

    let effectiveClientId = clientId;

    if (req.user?.role === "CLIENT") {
      if (!req.user.clientId) {
        return res.status(403).json({ message: "Perfil de cliente incompleto." });
      }
      effectiveClientId = req.user.clientId;
    }

    const [client, service] = await Promise.all([
      prisma.client.findUnique({ where: { id: effectiveClientId } }),
      prisma.service.findUnique({ where: { id: serviceId } })
    ]);

    if (!client || !service) {
      return res.status(404).json({ message: "Cliente ou serviço não encontrado." });
    }

    const appointment = await prisma.appointment.create({
      data: {
        clientId: effectiveClientId,
        serviceId,
        date: new Date(date),
        notes,
        payment: {
          create: {
            status: "PENDENTE",
            amount: service.price
          }
        }
      },
      include: {
        client: true,
        service: true,
        payment: true
      }
    });

    const dateFormatted = format(new Date(date), "dd/MM/yyyy HH:mm", { locale: ptBR });

    notifyNewAppointment({
      clientName: client.name,
      serviceName: service.name,
      dateTime: dateFormatted,
      phone: client.phone
    }).catch((error) => console.error("Erro ao enviar notificação:", error));

    return res.status(201).json(serializeAppointment(appointment));
  },

  async updateStatus(req: Request, res: Response) {
    const { id } = req.params;
    const parseResult = updateAppointmentStatusSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ message: parseResult.error.flatten() });
    }

    const shouldMarkPaid = parseResult.data.status === "ENTREGUE";

    const appointment = await prisma.appointment.update({
      where: { id },
      data: {
        status: parseResult.data.status,
        payment: shouldMarkPaid
          ? {
              update: {
                status: "PAGO",
                paidAt: new Date()
              }
            }
          : undefined
      },
      include: {
        client: true,
        service: true,
        payment: true
      }
    });

    notifyStatusChange({
      clientName: appointment.client.name,
      phone: appointment.client.phone,
      serviceName: appointment.service.name,
      dateTime: appointment.date.toISOString(),
      status: parseResult.data.status
    }).catch((error) => console.error("Erro ao enviar notificação de status:", error));

    if (shouldMarkPaid && appointment.payment) {
      const { notifyPaymentStatusChange } = await import("../services/whatsapp.service");
      notifyPaymentStatusChange({
        clientName: appointment.client.name,
        phone: appointment.client.phone,
        serviceName: appointment.service.name,
        dateTime: appointment.date.toISOString(),
        status: appointment.payment.status
      }).catch((error) => console.error("Erro ao enviar notificação de pagamento:", error));
    }

    return res.json(serializeAppointment(appointment));
  }
};


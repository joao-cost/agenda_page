import type { Request, Response } from "express";
import type { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma";
import {
  availabilityQuerySchema,
  createAppointmentSchema,
  updateAppointmentStatusSchema,
  updateAppointmentSchema
} from "../schemas/appointment";
import { notifyNewAppointment, notifyStatusChange, notifyCancellation } from "../services/whatsapp.service";
import { tryLockAppointmentSlot, findAvailableWasher } from "../services/appointment-lock.service";
import { addMinutes, endOfDay, format, isBefore, isSameDay, setHours, setMilliseconds, setMinutes, setSeconds, startOfDay } from "date-fns";
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

    const { serviceId, date, washerId } = parseResult.data;

    const service = await prisma.service.findUnique({
      where: { id: serviceId }
    });

    if (!service) {
      return res.status(404).json({ message: "Serviço não encontrado." });
    }

    // Buscar configurações gerais
    let generalSettings = await prisma.generalSettings.findUnique({
      where: { id: "default" }
    });

    if (!generalSettings) {
      generalSettings = await prisma.generalSettings.create({
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

    const selectedDate = new Date(`${date}T00:00:00`);
    const dayOfWeek = selectedDate.getDay(); // 0 = domingo, 1 = segunda, etc
    const workDaysArray = generalSettings.workDays.split(",").map(Number);
    
    // Verificar se o dia da semana está nos dias de trabalho
    if (!workDaysArray.includes(dayOfWeek)) {
      return res.json({
        date,
        serviceId,
        serviceDuration: service.durationMin,
        workingHours: {
          start: null,
          end: null
        },
        availableSlots: []
      });
    }

    // Verificar se a data está nas datas fechadas
    const closedDates = generalSettings.closedDates ? JSON.parse(generalSettings.closedDates) : [];
    const dateString = date; // formato yyyy-MM-dd
    if (closedDates.includes(dateString)) {
      return res.json({
        date,
        serviceId,
        serviceDuration: service.durationMin,
        workingHours: {
          start: null,
          end: null
        },
        availableSlots: []
      });
    }

    const dayStart = startOfDay(selectedDate);
    const dayEnd = endOfDay(selectedDate);

    const workingStart = setHours(setMinutes(setSeconds(setMilliseconds(dayStart, 0), 0), 0), generalSettings.workStartHour);
    const workingEnd = setHours(setMinutes(setSeconds(setMilliseconds(dayStart, 0), 0), 0), generalSettings.workEndHour);

    const appointments = await prisma.appointment.findMany({
      where: {
        date: {
          gte: workingStart,
          lt: dayEnd
        },
        status: {
          not: "CANCELADO"
        }
      },
      include: {
        service: true
      }
    });

    const slotDuration = service.durationMin;
    const step = 30;
    const availableSlots: Date[] = [];
    const maxConcurrent = generalSettings.multiWasher ? generalSettings.maxConcurrentBookings : 1;

    // Se a data selecionada for hoje, começar do próximo horário disponível (arredondado para cima)
    const now = new Date();
    const isToday = isSameDay(selectedDate, now);
    let startTime = workingStart;
    
    if (isToday) {
      // Calcular o próximo slot disponível (arredondar para cima em intervalos de 30 minutos)
      // Exemplo: se são 13:36, o próximo slot é 14:00
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      
      // Calcular o próximo slot de 30 minutos
      let nextSlotHour = currentHour;
      let nextSlotMinute = 0;
      
      if (currentMinute < 30) {
        // Se ainda não passou das 30, próximo slot é às :30 da mesma hora
        nextSlotMinute = 30;
      } else {
        // Se passou das 30, próximo slot é na próxima hora às :00
        nextSlotHour = currentHour + 1;
        nextSlotMinute = 0;
      }
      
      // Se já passou do horário de trabalho, não há slots disponíveis hoje
      if (nextSlotHour > generalSettings.workEndHour || 
          (nextSlotHour === generalSettings.workEndHour && nextSlotMinute > 0)) {
        return res.json({
          date,
          serviceId,
          serviceDuration: slotDuration,
          workingHours: {
            start: workingStart.toISOString(),
            end: workingEnd.toISOString()
          },
          availableSlots: []
        });
      }
      
      // Definir o horário inicial como o próximo slot disponível
      startTime = setHours(setMinutes(setSeconds(setMilliseconds(dayStart, 0), 0), 0), nextSlotHour);
      startTime = setMinutes(startTime, nextSlotMinute);
      
      // Garantir que não comece antes do horário de trabalho
      if (isBefore(startTime, workingStart)) {
        startTime = workingStart;
      }
    }

    let cursor = startTime;
    while (isBefore(addMinutes(cursor, slotDuration - 1), workingEnd) || addMinutes(cursor, slotDuration).getTime() === workingEnd.getTime()) {
      const slotEnd = addMinutes(cursor, slotDuration);

      // Se for hoje, pular slots que já passaram
      if (isToday && isBefore(slotEnd, now)) {
        cursor = addMinutes(cursor, step);
        continue;
      }

      // Contar quantos agendamentos sobrepõem este slot
      // Se multi-lavador está ativo e washerId foi fornecido, filtrar por lavador
      const relevantAppointments = washerId
        ? appointments.filter((appointment) => appointment.washerId === washerId)
        : appointments;
      
      const overlappingCount = relevantAppointments.filter((appointment) => {
        const apptStart = appointment.date;
        const apptEnd = addMinutes(apptStart, appointment.service.durationMin);
        return cursor < apptEnd && slotEnd > apptStart;
      }).length;

      // Se há menos agendamentos sobrepostos que o máximo permitido, o slot está disponível
      if (overlappingCount < maxConcurrent && slotEnd <= workingEnd) {
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

    const { clientId, serviceId, date, notes, washerId } = parseResult.data;

    let effectiveClientId = clientId;

    if (req.user?.role === "CLIENT") {
      if (!req.user.clientId) {
        return res.status(403).json({ message: "Perfil de cliente incompleto." });
      }
      effectiveClientId = req.user.clientId;
    }

    const [client, service, generalSettings] = await Promise.all([
      prisma.client.findUnique({ where: { id: effectiveClientId } }),
      prisma.service.findUnique({ where: { id: serviceId } }),
      prisma.generalSettings.findUnique({ where: { id: "default" } })
    ]);

    if (!client || !service) {
      return res.status(404).json({ message: "Cliente ou serviço não encontrado." });
    }

    // Atribuição automática de lavador se multi-washer estiver ativo e não foi especificado
    let effectiveWasherId = washerId || null;
    const appointmentDate = new Date(date);
    const maxConcurrent = generalSettings?.maxConcurrentBookings || 1;

    // Se multi-lavador está ativo e washerId não foi fornecido, encontrar lavador disponível
    if (!effectiveWasherId && generalSettings?.multiWasher) {
      const washers = generalSettings.washers ? JSON.parse(generalSettings.washers) : [];
      if (washers.length > 0) {
        console.log(`[Appointment] Buscando lavador disponível para ${washers.length} lavador(es) no horário ${format(appointmentDate, "dd/MM/yyyy HH:mm")}`);
        
        // Usar serviço de lock para encontrar lavador disponível com controle de concorrência
        const availableWasher = await findAvailableWasher(
          appointmentDate,
          service.durationMin,
          washers,
          maxConcurrent
        );

        if (availableWasher) {
          effectiveWasherId = availableWasher.washerId;
          console.log(`[Appointment] Lavador atribuído automaticamente: ${availableWasher.name} (ID: ${effectiveWasherId})`);
        } else {
          console.log(`[Appointment] Todos os lavadores estão ocupados no horário ${format(appointmentDate, "dd/MM/yyyy HH:mm")}`);
          return res.status(400).json({ 
            message: `Não há disponibilidade neste horário. Todos os ${washers.length} lavador(es) estão ocupados.` 
          });
        }
      }
    }

    // Verificar disponibilidade final com lock (prevenir race condition)
    const lockResult = await tryLockAppointmentSlot(
      appointmentDate,
      service.durationMin,
      effectiveWasherId,
      maxConcurrent
    );

    if (!lockResult.success) {
      return res.status(400).json({ 
        message: lockResult.message || "Não há disponibilidade neste horário." 
      });
    }

    const appointment = await prisma.appointment.create({
      data: {
        clientId: effectiveClientId,
        serviceId,
        date: new Date(date),
        notes,
        washerId: effectiveWasherId,
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

    notifyNewAppointment({
      clientName: client.name,
      serviceName: service.name,
      dateTime: appointment.date.toISOString(),
      phone: client.phone,
      adminPhone: generalSettings?.adminPhone || undefined
    }).catch((error) => console.error("Erro ao enviar notificação:", error));

    return res.status(201).json(serializeAppointment(appointment));
  },

  async updateStatus(req: Request, res: Response) {
    const { id } = req.params;
    const parseResult = updateAppointmentStatusSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ message: parseResult.error.flatten() });
    }

    // Verificar se o agendamento existe e se o usuário tem permissão
    const existingAppointment = await prisma.appointment.findUnique({
      where: { id },
      include: { client: true }
    });

    if (!existingAppointment) {
      return res.status(404).json({ message: "Agendamento não encontrado." });
    }

    // Se for cliente, só pode cancelar seus próprios agendamentos
    if (req.user?.role === "CLIENT") {
      if (existingAppointment.clientId !== req.user.clientId) {
        return res.status(403).json({ message: "Você não tem permissão para alterar este agendamento." });
      }
      // Clientes só podem cancelar, não podem alterar para outros status
      if (parseResult.data.status !== "CANCELADO") {
        return res.status(403).json({ message: "Clientes só podem cancelar agendamentos." });
      }
      
      // Clientes não podem cancelar 1h antes do agendamento
      const now = new Date();
      const appointmentDate = existingAppointment.date;
      const oneHourBefore = new Date(appointmentDate);
      oneHourBefore.setHours(oneHourBefore.getHours() - 1);
      
      if (now >= oneHourBefore) {
        return res.status(403).json({ 
          message: "Não é possível cancelar o agendamento com menos de 1 hora de antecedência. Entre em contato com o estabelecimento." 
        });
      }
    }

    // Removido: não marca como pago automaticamente ao entregar
    // O pagamento deve ser marcado manualmente

    const appointment = await prisma.appointment.update({
      where: { id },
      data: {
        status: parseResult.data.status
      },
      include: {
        client: true,
        service: true,
        payment: true
      }
    });

    // Se foi cancelado, usar notificação específica de cancelamento
    if (parseResult.data.status === "CANCELADO") {
      const { notifyCancellation } = await import("../services/whatsapp.service");
      notifyCancellation({
        clientName: appointment.client.name,
        phone: appointment.client.phone,
        serviceName: appointment.service.name,
        dateTime: appointment.date.toISOString()
      }).catch((error) => console.error("Erro ao enviar notificação de cancelamento:", error));
    } else {
      notifyStatusChange({
        clientName: appointment.client.name,
        phone: appointment.client.phone,
        serviceName: appointment.service.name,
        dateTime: appointment.date.toISOString(),
        status: parseResult.data.status
      }).catch((error) => console.error("Erro ao enviar notificação de status:", error));
    }


    return res.json(serializeAppointment(appointment));
  },

  async update(req: Request, res: Response) {
    const { id } = req.params;
    const parseResult = updateAppointmentSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ message: parseResult.error.flatten() });
    }

    const appointment = await prisma.appointment.findUnique({
      where: { id },
      include: { client: true, service: true, payment: true }
    });

    if (!appointment) {
      return res.status(404).json({ message: "Agendamento não encontrado." });
    }

    const updateData: any = {};

    if (parseResult.data.serviceId) {
      const service = await prisma.service.findUnique({
        where: { id: parseResult.data.serviceId }
      });
      if (!service) {
        return res.status(404).json({ message: "Serviço não encontrado." });
      }
      updateData.serviceId = parseResult.data.serviceId;
      
      // Atualizar valor do pagamento se o serviço mudou
      if (appointment.payment) {
        await prisma.payment.update({
          where: { id: appointment.payment.id },
          data: { amount: service.price }
        });
      }
    }

    if (parseResult.data.date || parseResult.data.washerId !== undefined) {
      // Se está alterando data ou lavador, verificar conflitos
      const newDate = parseResult.data.date ? new Date(parseResult.data.date) : appointment.date;
      const newWasherId = parseResult.data.washerId !== undefined ? parseResult.data.washerId : appointment.washerId;
      
      // Buscar configurações para maxConcurrent
      const generalSettings = await prisma.generalSettings.findUnique({
        where: { id: "default" }
      });
      const maxConcurrent = generalSettings?.maxConcurrentBookings || 1;
      
      // Verificar conflitos (excluindo o próprio agendamento)
      const lockResult = await tryLockAppointmentSlot(
        newDate,
        appointment.service.durationMin,
        newWasherId,
        maxConcurrent
      );
      
      // Verificar conflitos manualmente excluindo o próprio agendamento
      const dayStart = startOfDay(newDate);
      const dayEnd = endOfDay(newDate);
      const appointmentEnd = addMinutes(newDate, appointment.service.durationMin);
      
      const conflictingAppointments = await prisma.appointment.findMany({
        where: {
          id: { not: id }, // Excluir o próprio agendamento
          date: {
            gte: dayStart,
            lte: dayEnd
          },
          status: {
            not: "CANCELADO"
          },
          ...(newWasherId ? { washerId: newWasherId } : { washerId: { not: null } })
        },
        include: {
          service: true
        }
      });
      
      const overlappingCount = conflictingAppointments.filter((apt) => {
        const aptStart = apt.date;
        const aptEnd = addMinutes(aptStart, apt.service.durationMin);
        return aptStart < appointmentEnd && aptEnd > newDate;
      }).length;
      
      if (overlappingCount >= maxConcurrent) {
        return res.status(400).json({
          message: `Não é possível alterar para este horário. Já existem ${overlappingCount} agendamento(s) sobrepostos.`
        });
      }
    }

    if (parseResult.data.date) {
      updateData.date = new Date(parseResult.data.date);
    }

    if (parseResult.data.washerId !== undefined) {
      updateData.washerId = parseResult.data.washerId;
    }

    if (parseResult.data.notes !== undefined) {
      updateData.notes = parseResult.data.notes;
    }

    const updatedAppointment = await prisma.appointment.update({
      where: { id },
      data: updateData,
      include: {
        client: true,
        service: true,
        payment: true
      }
    });

    return res.json(serializeAppointment(updatedAppointment));
  }
};


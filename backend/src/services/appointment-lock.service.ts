/**
 * Serviço para controle de concorrência em agendamentos
 * Previne race conditions quando múltiplos clientes tentam agendar simultaneamente
 */

import { prisma } from "../lib/prisma";
import { startOfDay, endOfDay } from "date-fns";

interface LockResult {
  success: boolean;
  message?: string;
}

/**
 * Verifica e reserva um slot de agendamento usando transação com lock
 * Retorna true se o slot está disponível e foi reservado
 */
export async function tryLockAppointmentSlot(
  date: Date,
  serviceDurationMin: number,
  washerId: string | null,
  maxConcurrent: number
): Promise<LockResult> {
  try {
    // Usar transação com nível Serializable para garantir atomicidade
    // Este nível de isolamento previne race conditions naturalmente
    const result = await prisma.$transaction(async (tx) => {
      const dayStart = startOfDay(date);
      const dayEnd = endOfDay(date);
      const appointmentEnd = new Date(date.getTime() + serviceDurationMin * 60 * 1000);

      // Buscar agendamentos do dia
      // Com nível Serializable, o PostgreSQL garante que não haverá leituras inconsistentes
      const dayAppointments = await tx.appointment.findMany({
        where: {
          date: {
            gte: dayStart,
            lte: dayEnd
          },
          status: {
            not: "CANCELADO"
          }
        },
        include: {
          service: true
        }
      });

      // Se washerId fornecido, verificar apenas esse lavador
      // Se não, verificar todos os lavadores (modo multi-lavador)
      const relevantAppointments = washerId
        ? dayAppointments.filter((apt) => apt.washerId === washerId)
        : dayAppointments.filter((apt) => apt.washerId !== null);

      // Contar sobreposições
      const overlappingCount = relevantAppointments.filter((apt) => {
        const aptStart = new Date(apt.date);
        const aptEnd = new Date(aptStart.getTime() + apt.service.durationMin * 60 * 1000);
        return aptStart < appointmentEnd && aptEnd > date;
      }).length;

      // Verificar se há disponibilidade
      if (overlappingCount >= maxConcurrent) {
        return {
          success: false,
          message: `Não há disponibilidade. Já existem ${overlappingCount} agendamento(s) neste horário.`
        };
      }

      return {
        success: true
      };
    }, {
      timeout: 5000, // Timeout de 5 segundos
      isolationLevel: 'Serializable' // Nível mais alto de isolamento
    });

    return result;
  } catch (error: any) {
    console.error("[AppointmentLock] Erro ao verificar lock:", error);
    
    // Se for erro de timeout ou deadlock, retornar erro específico
    if (error.code === 'P2034' || error.message?.includes('timeout')) {
      return {
        success: false,
        message: "Sistema ocupado. Por favor, tente novamente em alguns segundos."
      };
    }

    return {
      success: false,
      message: "Erro ao verificar disponibilidade. Tente novamente."
    };
  }
}

/**
 * Verifica disponibilidade de múltiplos lavadores e retorna o melhor disponível
 */
export async function findAvailableWasher(
  date: Date,
  serviceDurationMin: number,
  washers: Array<{ id: string; name: string }>,
  maxConcurrent: number
): Promise<{ washerId: string; name: string } | null> {
  try {
    const dayStart = startOfDay(date);
    const dayEnd = endOfDay(date);
    const appointmentEnd = new Date(date.getTime() + serviceDurationMin * 60 * 1000);

    // Buscar todos os agendamentos do dia
    const dayAppointments = await prisma.appointment.findMany({
      where: {
        date: {
          gte: dayStart,
          lte: dayEnd
        },
        status: {
          not: "CANCELADO"
        }
      },
      include: {
        service: true
      }
    });

    const washerAvailability: Array<{
      id: string;
      name: string;
      hasConflict: boolean;
      overlappingCount: number;
    }> = [];

    // Verificar cada lavador
    for (const washer of washers) {
      const washerAppointments = dayAppointments.filter(
        (apt) => apt.washerId === washer.id
      );

      const overlappingCount = washerAppointments.filter((apt) => {
        const aptStart = new Date(apt.date);
        const aptEnd = new Date(aptStart.getTime() + apt.service.durationMin * 60 * 1000);
        return aptStart < appointmentEnd && aptEnd > date;
      }).length;

      const hasConflict = overlappingCount >= maxConcurrent;

      washerAvailability.push({
        id: washer.id,
        name: washer.name,
        hasConflict,
        overlappingCount
      });
    }

    // Escolher lavador sem conflito, priorizando o com menos sobreposições
    const availableWashers = washerAvailability.filter((w) => !w.hasConflict);
    if (availableWashers.length > 0) {
      availableWashers.sort((a, b) => a.overlappingCount - b.overlappingCount);
      return {
        washerId: availableWashers[0].id,
        name: availableWashers[0].name
      };
    }

    return null;
  } catch (error: any) {
    console.error("[AppointmentLock] Erro ao encontrar lavador disponível:", error);
    return null;
  }
}


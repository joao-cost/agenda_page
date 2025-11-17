import { prisma } from "../lib/prisma";
import { startOfDay, subDays } from "date-fns";
import { notifyCancellation } from "../services/whatsapp.service";

/**
 * Job para cancelar agendamentos não realizados do dia anterior
 * Deve ser executado diariamente (ex: às 00:00 ou 01:00)
 */
export async function cancelPendingAppointments() {
  try {
    // Data de ontem (início e fim do dia)
    const yesterday = subDays(new Date(), 1);
    const yesterdayStart = startOfDay(yesterday);
    const yesterdayEnd = new Date(yesterdayStart);
    yesterdayEnd.setHours(23, 59, 59, 999);

    // Buscar agendamentos do dia anterior que não foram concluídos
    const pendingAppointments = await prisma.appointment.findMany({
      where: {
        date: {
          gte: yesterdayStart,
          lte: yesterdayEnd
        },
        status: {
          in: ["AGENDADO", "LAVANDO"] // Apenas agendados ou em lavagem que não foram entregues
        }
      },
      include: {
        client: true,
        service: true
      }
    });

    console.log(`[Job] Encontrados ${pendingAppointments.length} agendamentos pendentes do dia anterior.`);

    // Cancelar cada agendamento e notificar o cliente
    for (const appointment of pendingAppointments) {
      await prisma.appointment.update({
        where: { id: appointment.id },
        data: { status: "CANCELADO" }
      });

      // Notificar o cliente
      try {
        await notifyCancellation({
          clientName: appointment.client.name,
          phone: appointment.client.phone,
          serviceName: appointment.service.name,
          dateTime: appointment.date.toISOString()
        });
        console.log(`[Job] Agendamento ${appointment.id} cancelado e cliente notificado.`);
      } catch (error) {
        console.error(`[Job] Erro ao notificar cliente do agendamento ${appointment.id}:`, error);
      }
    }

    console.log(`[Job] Processo concluído. ${pendingAppointments.length} agendamentos cancelados.`);
  } catch (error) {
    console.error("[Job] Erro ao cancelar agendamentos pendentes:", error);
    throw error;
  }
}


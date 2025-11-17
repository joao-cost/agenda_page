import { useEffect, useState, useCallback } from "react";
import { format, parseISO, startOfDay } from "date-fns";
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, PointerSensor, useSensor, useSensors, closestCorners } from "@dnd-kit/core";
import { listAppointments, updateAppointmentStatus } from "../../api/appointments";
import type { Appointment, AppointmentStatus } from "../../types";
import { updatePaymentStatus } from "../../api/payments";
import { useIsMobile } from "../../utils/useIsMobile";
import { KanbanColumn } from "./KanbanColumn";
import { DashboardStats } from "./DashboardStats";
import { AppointmentDetailsModal } from "../../components/modals/AppointmentDetailsModal";

const columns: { status: AppointmentStatus; title: string }[] = [
  { status: "AGENDADO", title: "Agendado" },
  { status: "LAVANDO", title: "Lavando" },
  { status: "ENTREGUE", title: "Entregue" }
];

export function DashboardKanban() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(() => startOfDay(new Date()));
  const [activeId, setActiveId] = useState<string | null>(null);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const isMobile = useIsMobile();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8
      }
    })
  );

  const fetchAppointments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Usar start e end para garantir que pega apenas o dia selecionado
      const startOfDay = new Date(selectedDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(selectedDate);
      endOfDay.setHours(23, 59, 59, 999);
      
      const data = await listAppointments({ 
        start: startOfDay.toISOString(),
        end: endOfDay.toISOString()
      });
      // Filtrar agendamentos cancelados
      const filteredData = data.filter((apt) => apt.status !== "CANCELADO");
      setAppointments(filteredData);
    } catch (error) {
      console.error(error);
      setError("Não foi possível carregar a agenda.");
    } finally {
      setLoading(false);
    }
  }, [selectedDate]);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  useEffect(() => {
    function handleAppointmentCreated(event: Event) {
      const detail = (event as CustomEvent).detail as { date?: string } | undefined;
      if (!detail?.date) {
        fetchAppointments();
        return;
      }
      const eventDate = parseISO(detail.date);
      if (startOfDay(eventDate).getTime() === selectedDate.getTime()) {
        fetchAppointments();
      }
    }
    window.addEventListener("appointment:created", handleAppointmentCreated);
    return () => {
      window.removeEventListener("appointment:created", handleAppointmentCreated);
    };
  }, [fetchAppointments, selectedDate]);

  const handleAdvance = async (id: string, nextStatus: AppointmentStatus) => {
    const appointment = appointments.find((a) => a.id === id);
    if (!appointment) return;

    // Verificar se está tentando voltar para trás quando já está em LAVANDO ou ENTREGUE
    const statusOrder: AppointmentStatus[] = ["AGENDADO", "LAVANDO", "ENTREGUE"];
    const currentIndex = statusOrder.indexOf(appointment.status);
    const nextIndex = statusOrder.indexOf(nextStatus);

    if (currentIndex > nextIndex) {
      // Tentando voltar para trás
      if (appointment.status === "LAVANDO" || appointment.status === "ENTREGUE") {
        alert("Não é possível voltar o status após iniciar a lavagem.");
        return;
      }
    }

    // Confirmação antes de alterar status
    const statusLabels: Record<AppointmentStatus, string> = {
      AGENDADO: "Agendado",
      LAVANDO: "Lavando",
      ENTREGUE: "Entregue",
      CANCELADO: "Cancelado"
    };

    const confirmMessage = `Deseja realmente alterar o status de "${statusLabels[appointment.status]}" para "${statusLabels[nextStatus]}"?`;
    if (!confirm(confirmMessage)) {
      return;
    }

    try {
      const updated = await updateAppointmentStatus(id, nextStatus);
      setAppointments((prev) => prev.map((item) => (item.id === id ? updated : item)));
    } catch (error) {
      console.error(error);
      alert("Erro ao atualizar status. Tente novamente.");
    }
  };

  const handleMarkPaid = async (appointment: Appointment) => {
    if (!appointment.payment) return;
    try {
      await updatePaymentStatus(appointment.payment.id, "PAGO");
      fetchAppointments();
    } catch (error) {
      console.error(error);
    }
  };

  const getNextStatus = (status: AppointmentStatus): AppointmentStatus | null => {
    if (status === "AGENDADO") return "LAVANDO";
    if (status === "LAVANDO") return "ENTREGUE";
    return null;
  };

  const getStatusFromColumnId = (columnId: string): AppointmentStatus => {
    const column = columns.find((col) => col.status === columnId);
    return column?.status || "AGENDADO";
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const appointmentId = active.id as string;
    const appointment = appointments.find((a) => a.id === appointmentId);
    if (!appointment) return;

    // Se over.id é um status válido (coluna), usar diretamente
    let targetStatus: AppointmentStatus | null = null;
    if (over.id === "AGENDADO" || over.id === "LAVANDO" || over.id === "ENTREGUE") {
      targetStatus = over.id as AppointmentStatus;
    } else {
      // Se for um card, buscar o elemento DOM e encontrar o parent com data-column-status
      try {
        const overElement = document.querySelector(`[data-draggable-id="${over.id}"]`) ||
                           document.querySelector(`[data-droppable-id="${over.id}"]`);
        
        if (overElement) {
          // Buscar o elemento pai mais próximo com data-column-status
          const columnElement = overElement.closest('[data-column-status]');
          if (columnElement) {
            const columnStatus = columnElement.getAttribute('data-column-status');
            if (columnStatus && (columnStatus === "AGENDADO" || columnStatus === "LAVANDO" || columnStatus === "ENTREGUE")) {
              targetStatus = columnStatus as AppointmentStatus;
            }
          }
        }
      } catch (e) {
        console.warn("Erro ao buscar elemento DOM:", e);
      }
      
      // Fallback: se não encontrar pelo DOM, tentar pelo appointment
      if (!targetStatus) {
        const targetAppointment = appointments.find((a) => a.id === over.id);
        if (targetAppointment) {
          targetStatus = targetAppointment.status;
        } else {
          targetStatus = getStatusFromColumnId(over.id as string);
        }
      }
    }

    if (!targetStatus || appointment.status === targetStatus) return;

    // Verificar se está tentando voltar para trás
    const statusOrder: AppointmentStatus[] = ["AGENDADO", "LAVANDO", "ENTREGUE"];
    const currentIndex = statusOrder.indexOf(appointment.status);
    const nextIndex = statusOrder.indexOf(targetStatus);

    if (currentIndex > nextIndex) {
      // Tentando voltar para trás
      if (appointment.status === "LAVANDO" || appointment.status === "ENTREGUE") {
        alert("Não é possível voltar o status após iniciar a lavagem.");
        return;
      }
    }

    // Confirmação antes de alterar status via drag
    const statusLabels: Record<AppointmentStatus, string> = {
      AGENDADO: "Agendado",
      LAVANDO: "Lavando",
      ENTREGUE: "Entregue",
      CANCELADO: "Cancelado"
    };

    const confirmMessage = `Deseja realmente alterar o status de "${statusLabels[appointment.status]}" para "${statusLabels[targetStatus]}"?`;
    if (!confirm(confirmMessage)) {
      return;
    }

    await handleAdvance(appointmentId, targetStatus);
  };

  const activeAppointment = activeId ? appointments.find((a) => a.id === activeId) : null;

  if (loading) {
    return <p className="text-sm text-secondary-600">Carregando agenda...</p>;
  }

  if (error) {
    return <p className="text-sm text-red-600">{error}</p>;
  }

  const columnColors = {
    AGENDADO: "from-blue-500/10 to-blue-600/5 border-blue-300/30",
    LAVANDO: "from-yellow-500/10 to-yellow-600/5 border-yellow-300/30",
    ENTREGUE: "from-green-500/10 to-green-600/5 border-green-300/30"
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex-shrink-0 mb-4">
        <DashboardStats />
      </div>

      <div className="flex-1 overflow-auto min-h-0">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="grid gap-6 lg:grid-cols-3 h-full items-stretch">
          {columns.map((column) => {
            const columnAppointments = appointments.filter((appt) => appt.status === column.status);
            return (
                <KanbanColumn
                key={column.status}
                status={column.status}
                title={column.title}
                appointments={columnAppointments}
                getNextStatus={getNextStatus}
                onAdvance={handleAdvance}
                onMarkPaid={handleMarkPaid}
                onCardClick={(appointment) => {
                  setSelectedAppointment(appointment);
                  setIsDetailsOpen(true);
                }}
                isMobile={isMobile}
                colorClass={columnColors[column.status]}
              />
            );
          })}
        </div>
        <DragOverlay>
          {activeAppointment ? (
            <div className="rounded-xl border-2 border-primary bg-white p-3 shadow-2xl">
              <div className="flex items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-bold text-secondary-900 truncate">
                    {activeAppointment.client.name}
                  </h3>
                  <div className="flex items-center gap-2">
                    <p className="text-xs text-secondary-600 truncate">
                      {activeAppointment.client.vehicle}
                    </p>
                    {activeAppointment.client.plate && (
                      <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-gradient-to-r from-primary to-accent text-white shadow-sm flex-shrink-0">
                        {activeAppointment.client.plate}
                      </span>
                    )}
                  </div>
                </div>
                <span className="rounded-full bg-gradient-to-r from-primary to-accent px-2 py-1 text-xs font-bold text-white shadow-md flex-shrink-0">
                  {format(new Date(activeAppointment.date), "HH:mm")}
                </span>
              </div>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
      </div>

      {/* Modal de Detalhes */}
      <AppointmentDetailsModal
        isOpen={isDetailsOpen}
        onClose={() => {
          setIsDetailsOpen(false);
          setSelectedAppointment(null);
        }}
        appointment={selectedAppointment}
        onUpdate={() => {
          fetchAppointments();
        }}
      />
    </div>
  );
}



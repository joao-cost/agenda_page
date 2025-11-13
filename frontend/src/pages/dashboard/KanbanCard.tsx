import { format } from "date-fns";
import { useDraggable } from "@dnd-kit/core";
import type { Appointment, AppointmentStatus } from "../../types";
import { Button } from "../../components/ui/Button";
import { Badge } from "../../components/ui/Badge";
import { GripVertical } from "lucide-react";
import { cn } from "../../utils/cn";

interface KanbanCardProps {
  appointment: Appointment;
  nextStatus: AppointmentStatus | null;
  onAdvance: (id: string, status: AppointmentStatus) => void;
  onMarkPaid: (appointment: Appointment) => void;
  isDragging?: boolean;
  isMobile: boolean;
}

export function KanbanCard({
  appointment,
  nextStatus,
  onAdvance,
  onMarkPaid,
  isDragging = false,
  isMobile
}: KanbanCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: cardIsDragging
  } = useDraggable({
    id: appointment.id,
    disabled: isMobile
  });

  const style = {
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    transition: cardIsDragging ? undefined : transition,
    opacity: cardIsDragging ? 0 : 1
  };

  return (
    <div
      ref={setNodeRef}
      data-draggable-id={appointment.id}
      style={style}
      {...(!isMobile ? { ...attributes, ...listeners } : {})}
      className={cn(
        "group rounded-xl border-2 border-secondary-200 bg-white p-5 shadow-md hover:shadow-xl transition-all",
        !isMobile && !cardIsDragging && "cursor-grab",
        cardIsDragging && "cursor-grabbing ring-2 ring-primary ring-offset-2 z-50 rotate-2 shadow-2xl",
        isDragging && "opacity-50"
      )}
    >
      {!isMobile && (
        <div className="flex items-center justify-center mb-2 -mt-2 -mx-2 text-secondary-400 pointer-events-none">
          <GripVertical className="h-5 w-5" />
        </div>
      )}
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-base font-bold text-secondary-900">
            {appointment.client.name}
          </h3>
          <p className="text-xs text-secondary-600 mt-0.5">
            {appointment.client.vehicle}
          </p>
        </div>
        <span className="rounded-full bg-gradient-to-r from-primary to-accent px-3 py-1 text-xs font-bold text-white shadow-md">
          {format(new Date(appointment.date), "HH:mm")}
        </span>
      </div>
      <div className="mb-3 pb-3 border-b border-secondary-100">
        <p className="text-sm font-semibold text-secondary-900">
          {appointment.service.name}
        </p>
        <p className="text-sm font-bold text-primary mt-1">
          {appointment.service.price.toLocaleString("pt-BR", {
            style: "currency",
            currency: "BRL"
          })}
        </p>
      </div>
      <p className="text-[10px] uppercase tracking-wide text-secondary-400 mb-3">
        Atualizado em {format(new Date(appointment.updatedAt), "dd/MM HH:mm")}
      </p>
      <div className="mb-3 flex items-center justify-between">
        <span className="text-xs font-medium text-secondary-600">Pagamento:</span>
        <div className="flex items-center gap-2">
          <Badge
            className={
              appointment.payment?.status === "PAGO"
                ? "bg-green-500 text-white"
                : "bg-yellow-500 text-white"
            }
          >
            {appointment.payment?.status === "PAGO" ? "✅ Pago" : "⏳ Pendente"}
          </Badge>
          {appointment.payment?.status === "PENDENTE" && (
            <Button
              variant="outline"
              className="text-xs h-7 px-2 border-yellow-300 text-yellow-700 hover:bg-yellow-50"
              onClick={(e) => {
                e.stopPropagation();
                onMarkPaid(appointment);
              }}
            >
              Marcar pago
            </Button>
          )}
        </div>
      </div>
      {nextStatus && (
        <Button
          className="mt-2 w-full bg-gradient-to-r from-primary to-accent text-white shadow-lg hover:shadow-xl transition-all hover:scale-[1.02]"
          onClick={(e) => {
            e.stopPropagation();
            onAdvance(appointment.id, nextStatus);
          }}
        >
          ➡️ Mover para {nextStatus.toLowerCase()}
        </Button>
      )}
    </div>
  );
}


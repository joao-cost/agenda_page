import { useDroppable } from "@dnd-kit/core";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import { cn } from "../../utils/cn";
import type { Appointment, AppointmentStatus } from "../../types";
import { KanbanCard } from "./KanbanCard";

interface KanbanColumnProps {
  status: AppointmentStatus;
  title: string;
  appointments: Appointment[];
  getNextStatus: (status: AppointmentStatus) => AppointmentStatus | null;
  onAdvance: (id: string, status: AppointmentStatus) => void;
  onMarkPaid: (appointment: Appointment) => void;
  onCardClick?: (appointment: Appointment) => void;
  isMobile: boolean;
  colorClass: string;
}

export function KanbanColumn({
  status,
  title,
  appointments,
  getNextStatus,
  onAdvance,
  onMarkPaid,
  onCardClick,
  isMobile,
  colorClass
}: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: status
  });

  const count = appointments.length;

  return (
    <div
      ref={setNodeRef}
      data-droppable-id={status}
      data-column-status={status}
      className={cn(
        "h-full flex flex-col"
      )}
    >
      <Card
        className={cn(
          `bg-gradient-to-br ${colorClass} border-2 shadow-xl h-full flex flex-col transition-all`,
          isOver && "ring-2 ring-primary/50 ring-offset-1"
        )}
      >
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center justify-between">
            <span className="text-lg font-bold text-secondary-900">{title}</span>
            <Badge className="bg-secondary-900 text-white px-3 py-1 text-sm font-bold shadow-md">
              {count}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent 
          className="space-y-4 flex-1 overflow-y-auto"
          data-column-status={status}
        >
          {count === 0 ? (
            <div 
              className="rounded-xl bg-white/50 p-8 text-center border-2 border-dashed border-secondary-200"
              data-column-status={status}
            >
              <p className="text-sm text-secondary-500 font-medium">
                {!isMobile ? "Arraste cards aqui" : "Sem registros aqui."}
              </p>
            </div>
          ) : (
            appointments.map((appointment) => {
              const nextStatus = getNextStatus(appointment.status);
              return (
                <div key={appointment.id} data-column-status={status}>
                  <KanbanCard
                    appointment={appointment}
                    nextStatus={nextStatus}
                    onAdvance={onAdvance}
                    onMarkPaid={onMarkPaid}
                    onCardClick={onCardClick}
                    isMobile={isMobile}
                  />
                </div>
              );
            })
          )}
        </CardContent>
      </Card>
    </div>
  );
}


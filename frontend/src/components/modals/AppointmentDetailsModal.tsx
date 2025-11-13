import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { Appointment, AppointmentStatus } from "../../types";
import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";
import { Badge } from "../ui/Badge";
import { updateAppointmentStatus } from "../../api/appointments";
import { useState } from "react";
import { Edit, CheckCircle, XCircle } from "lucide-react";

interface AppointmentDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointment: Appointment | null;
  onUpdate?: () => void;
  onEdit?: (appointment: Appointment) => void;
}

export function AppointmentDetailsModal({
  isOpen,
  onClose,
  appointment,
  onUpdate,
  onEdit
}: AppointmentDetailsModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!appointment) return null;

  const handleStatusChange = async (newStatus: AppointmentStatus) => {
    setLoading(true);
    setError(null);
    try {
      await updateAppointmentStatus(appointment.id, newStatus);
      onUpdate?.();
      setTimeout(() => {
        onClose();
      }, 500);
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || "Erro ao atualizar status.");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!confirm("Tem certeza que deseja cancelar este agendamento?")) return;
    await handleStatusChange("CANCELADO" as AppointmentStatus);
  };

  const getStatusColor = (status: AppointmentStatus) => {
    switch (status) {
      case "AGENDADO":
        return "bg-blue-500 text-white";
      case "LAVANDO":
        return "bg-yellow-500 text-white";
      case "ENTREGUE":
        return "bg-green-500 text-white";
      case "CANCELADO":
        return "bg-red-500 text-white";
      default:
        return "bg-secondary-500 text-white";
    }
  };

  const getStatusLabel = (status: AppointmentStatus) => {
    switch (status) {
      case "AGENDADO":
        return "Agendado";
      case "LAVANDO":
        return "Lavando";
      case "ENTREGUE":
        return "Entregue";
      case "CANCELADO":
        return "Cancelado";
      default:
        return status;
    }
  };

  const appointmentDate = new Date(appointment.date);
  const endDate = new Date(appointmentDate);
  endDate.setMinutes(endDate.getMinutes() + appointment.service.durationMin);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Detalhes do Agendamento" size="md">
      <div className="space-y-6">
        {/* Status e Badge */}
        <div className="flex items-center justify-between">
          <Badge className={`${getStatusColor(appointment.status)} px-4 py-1.5 text-sm font-bold`}>
            {getStatusLabel(appointment.status)}
          </Badge>
          {appointment.payment && (
            <Badge
              className={
                appointment.payment.status === "PAGO"
                  ? "bg-green-500 text-white px-4 py-1.5 text-sm font-bold"
                  : "bg-yellow-500 text-white px-4 py-1.5 text-sm font-bold"
              }
            >
              {appointment.payment.status === "PAGO" ? "✅ Pago" : "⏳ Pendente"}
            </Badge>
          )}
        </div>

        {/* Informações do Cliente */}
        <div className="rounded-xl border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10 p-4">
          <h3 className="text-sm font-bold text-secondary-600 mb-3 uppercase tracking-wide">Cliente</h3>
          <div className="space-y-2">
            <div>
              <p className="text-xs text-secondary-500">Nome</p>
              <p className="text-base font-bold text-secondary-900">{appointment.client.name}</p>
            </div>
            <div>
              <p className="text-xs text-secondary-500">Telefone</p>
              <a
                href={`tel:${appointment.client.phone}`}
                className="text-base font-semibold text-primary hover:underline"
              >
                {appointment.client.phone}
              </a>
            </div>
            <div>
              <p className="text-xs text-secondary-500">Veículo</p>
              <p className="text-base font-semibold text-secondary-700">{appointment.client.vehicle}</p>
            </div>
          </div>
        </div>

        {/* Informações do Serviço */}
        <div className="rounded-xl border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10 p-4">
          <h3 className="text-sm font-bold text-secondary-600 mb-3 uppercase tracking-wide">Serviço</h3>
          <div className="space-y-2">
            <div>
              <p className="text-xs text-secondary-500">Nome do Serviço</p>
              <p className="text-base font-bold text-secondary-900">{appointment.service.name}</p>
            </div>
            <div className="flex items-center gap-4">
              <div>
                <p className="text-xs text-secondary-500">Duração</p>
                <p className="text-sm font-semibold text-secondary-700">{appointment.service.durationMin} minutos</p>
              </div>
              <div>
                <p className="text-xs text-secondary-500">Valor</p>
                <p className="text-sm font-bold text-primary">
                  {appointment.service.price.toLocaleString("pt-BR", {
                    style: "currency",
                    currency: "BRL"
                  })}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Data e Horário */}
        <div className="rounded-xl border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10 p-4">
          <h3 className="text-sm font-bold text-secondary-600 mb-3 uppercase tracking-wide">Data e Horário</h3>
          <div className="space-y-2">
            <div>
              <p className="text-xs text-secondary-500">Data</p>
              <p className="text-base font-bold text-secondary-900">
                {format(appointmentDate, "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
              </p>
            </div>
            <div>
              <p className="text-xs text-secondary-500">Horário</p>
              <p className="text-base font-semibold text-secondary-700">
                {format(appointmentDate, "HH:mm")} - {format(endDate, "HH:mm")}
              </p>
            </div>
          </div>
        </div>

        {/* Observações */}
        {appointment.notes && (
          <div className="rounded-xl border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10 p-4">
            <h3 className="text-sm font-bold text-secondary-600 mb-2 uppercase tracking-wide">Observações</h3>
            <p className="text-sm text-secondary-700">{appointment.notes}</p>
          </div>
        )}

        {/* Pagamento */}
        {appointment.payment && (
          <div className="rounded-xl border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10 p-4">
            <h3 className="text-sm font-bold text-secondary-600 mb-3 uppercase tracking-wide">Pagamento</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-secondary-600">Status:</span>
                <Badge
                  className={
                    appointment.payment.status === "PAGO"
                      ? "bg-green-500 text-white"
                      : "bg-yellow-500 text-white"
                  }
                >
                  {appointment.payment.status === "PAGO" ? "✅ Pago" : "⏳ Pendente"}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-secondary-600">Valor:</span>
                <span className="text-sm font-bold text-primary">
                  {appointment.payment.amount.toLocaleString("pt-BR", {
                    style: "currency",
                    currency: "BRL"
                  })}
                </span>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="rounded-xl bg-red-50 border-2 border-red-200 p-4 text-red-800">
            <p className="font-semibold text-sm">{error}</p>
          </div>
        )}

        {/* Ações */}
        <div className="flex flex-col gap-3 pt-4 border-t border-primary/20">
          {appointment.status !== "CANCELADO" && appointment.status !== "ENTREGUE" && (
            <div className="grid grid-cols-2 gap-3">
              {appointment.status === "AGENDADO" && (
                <Button
                  onClick={() => handleStatusChange("LAVANDO")}
                  disabled={loading}
                  className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white hover:from-yellow-600 hover:to-yellow-700"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Iniciar Lavagem
                </Button>
              )}
              {appointment.status === "LAVANDO" && (
                <Button
                  onClick={() => handleStatusChange("ENTREGUE")}
                  disabled={loading}
                  className="bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Marcar como Entregue
                </Button>
              )}
              <Button
                onClick={handleCancel}
                disabled={loading}
                variant="outline"
                className="border-red-300 text-red-700 hover:bg-red-50"
              >
                <XCircle className="h-4 w-4 mr-2" />
                Cancelar
              </Button>
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            {onEdit && (
              <Button
                onClick={() => {
                  onEdit(appointment);
                  onClose();
                }}
                variant="secondary"
                className="border-primary/30"
              >
                <Edit className="h-4 w-4 mr-2" />
                Editar
              </Button>
            )}
            <Button onClick={onClose} variant="outline" className="border-primary/30">
              Fechar
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}


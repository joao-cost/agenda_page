import { useEffect, useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { listAppointments, updateAppointmentStatus } from "../../api/appointments";
import type { Appointment } from "../../types";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Badge } from "../../components/ui/Badge";
import { Calendar, Clock, Car, DollarSign, XCircle, CheckCircle, AlertCircle, Sparkles, History } from "lucide-react";
import { useAuthStore } from "../../store/auth";

export function ClientHistory() {
  const { user } = useAuthStore();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAppointments() {
      if (!user?.clientId) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const data = await listAppointments();
        // Ordenar por data (mais recentes primeiro)
        const sorted = data.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        setAppointments(sorted);
      } catch (error) {
        console.error(error);
        setError("Não foi possível carregar o histórico.");
      } finally {
        setLoading(false);
      }
    }

    fetchAppointments();
  }, [user?.clientId]);

  const handleCancel = async (appointment: Appointment) => {
    if (!confirm("Tem certeza que deseja cancelar este agendamento?")) {
      return;
    }

    try {
      await updateAppointmentStatus(appointment.id, "CANCELADO");
      // Recarregar lista
      const data = await listAppointments();
      const sorted = data.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setAppointments(sorted);
    } catch (error: any) {
      console.error(error);
      alert(error.response?.data?.message || "Erro ao cancelar agendamento.");
    }
  };

  const canCancel = (appointment: Appointment) => {
    if (appointment.status !== "AGENDADO") return false;
    
    const now = new Date();
    const appointmentDate = new Date(appointment.date);
    const oneHourBefore = new Date(appointmentDate);
    oneHourBefore.setHours(oneHourBefore.getHours() - 1);
    
    return now < oneHourBefore;
  };

  const statusColors = {
    AGENDADO: "from-blue-500 to-blue-600",
    LAVANDO: "from-yellow-500 to-yellow-600",
    ENTREGUE: "from-green-500 to-green-600",
    CANCELADO: "from-red-500 to-red-600"
  };

  const statusLabels = {
    AGENDADO: "Agendado",
    LAVANDO: "Lavando",
    ENTREGUE: "Entregue",
    CANCELADO: "Cancelado"
  };

  const paymentStatusColors = {
    PENDENTE: "from-yellow-500 to-yellow-600",
    PAGO: "from-green-500 to-green-600"
  };

  const paymentStatusLabels = {
    PENDENTE: "Pendente",
    PAGO: "Pago"
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-white to-accent/5 py-6 md:py-10">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 sm:px-6">
        {/* Header */}
        <header className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-primary to-accent p-6 md:p-8 text-white shadow-2xl">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48Y2lyY2xlIGN4PSIzMCIgY3k9IjMwIiByPSIyMCIvPjwvZz48L2c+PC9zdmc+')] opacity-20"></div>
          <div className="relative z-10 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-yellow-300" />
                <span className="text-xs font-bold uppercase tracking-wider text-yellow-300">
                  Meu Histórico
                </span>
              </div>
              <h1 className="text-3xl font-bold md:text-4xl lg:text-5xl">
                Histórico de Agendamentos
                <br />
                <span className="text-primary-foreground/90">Todos os seus serviços</span>
              </h1>
              <p className="text-sm text-primary-foreground/90 md:text-base max-w-2xl">
                Visualize todos os seus agendamentos, passados e futuros. Você pode cancelar agendamentos futuros com pelo menos 1 hora de antecedência.
              </p>
            </div>
            <div className="rounded-2xl bg-white/20 backdrop-blur-sm border border-white/30 px-6 py-4 text-white shadow-xl">
              <div className="flex items-center gap-2 mb-2">
                <History className="h-4 w-4" />
                <p className="text-xs font-semibold uppercase tracking-wide">Total</p>
              </div>
              <p className="text-3xl font-bold">{appointments.length}</p>
            </div>
          </div>
        </header>

        {/* Lista de Agendamentos */}
        <Card className="bg-gradient-to-br from-white via-white to-primary/5 border-2 border-primary/20 shadow-xl">
          <CardHeader className="space-y-2 border-b-2 border-primary/20 pb-4">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-gradient-to-br from-primary to-accent p-2.5 shadow-lg">
                <History className="h-5 w-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-2xl font-bold text-secondary-900">Todos os agendamentos</CardTitle>
                <p className="text-sm text-secondary-600 mt-1">
                  Histórico completo dos seus serviços
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-sm font-medium text-secondary-600">Carregando histórico...</p>
              </div>
            ) : error ? (
              <div className="rounded-xl bg-red-50 border-2 border-red-200 p-6 text-center">
                <AlertCircle className="h-8 w-8 text-red-600 mx-auto mb-3" />
                <p className="text-sm font-medium text-red-800">{error}</p>
              </div>
            ) : appointments.length === 0 ? (
              <div className="text-center py-12 rounded-2xl bg-secondary-50 border-2 border-secondary-200">
                <Calendar className="h-12 w-12 text-secondary-400 mx-auto mb-3" />
                <p className="text-sm font-medium text-secondary-600">Você não possui agendamentos</p>
                <p className="text-xs text-secondary-500 mt-1">Faça seu primeiro agendamento na página de agendamento</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {appointments.map((appointment) => {
                  const appointmentDate = new Date(appointment.date);
                  const isPast = appointmentDate < new Date();
                  const cancelable = canCancel(appointment);

                  return (
                    <div
                      key={appointment.id}
                      className={`rounded-2xl border-2 p-5 shadow-lg transition-all ${
                        isPast
                          ? "border-secondary-200 bg-gradient-to-br from-secondary-50 to-white opacity-75"
                          : "border-primary/20 bg-gradient-to-br from-white to-primary/5 hover:shadow-xl hover:scale-[1.01]"
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                        <div className="flex-1 space-y-3">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1">
                              <h3 className="text-lg font-bold text-secondary-900 mb-2">{appointment.service.name}</h3>
                              <div className="flex flex-wrap items-center gap-2 mb-3">
                                <Badge className={`bg-gradient-to-r ${statusColors[appointment.status]} text-white font-bold shadow-md`}>
                                  {statusLabels[appointment.status]}
                                </Badge>
                                {appointment.payment && (
                                  <Badge className={`bg-gradient-to-r ${paymentStatusColors[appointment.payment.status]} text-white font-bold shadow-md`}>
                                    {paymentStatusLabels[appointment.payment.status]}
                                  </Badge>
                                )}
                              </div>
                            </div>
                            {cancelable && (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="h-8 px-3 text-xs border-red-300 text-red-700 hover:bg-red-50 hover:border-red-400 flex-shrink-0"
                                onClick={() => handleCancel(appointment)}
                              >
                                <XCircle className="h-3 w-3 mr-1" />
                                Cancelar
                              </Button>
                            )}
                            {appointment.status === "AGENDADO" && !cancelable && (
                              <div className="flex-shrink-0">
                                <Badge variant="secondary" className="text-xs bg-yellow-100 text-yellow-800 border-yellow-300">
                                  <AlertCircle className="h-3 w-3 mr-1" />
                                  Menos de 1h
                                </Badge>
                              </div>
                            )}
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="flex items-center gap-2 text-sm text-secondary-700">
                              <Calendar className="h-4 w-4 text-primary" />
                              <span className="font-medium">
                                {format(appointmentDate, "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-secondary-700">
                              <Clock className="h-4 w-4 text-primary" />
                              <span className="font-medium">
                                {format(appointmentDate, "HH:mm", { locale: ptBR })}h
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-secondary-700">
                              <Car className="h-4 w-4 text-primary" />
                              <span className="font-medium">{appointment.client.vehicle}</span>
                              {appointment.client.plate && (
                                <Badge className="bg-gradient-to-r from-primary to-accent text-white text-xs font-bold">
                                  {appointment.client.plate}
                                </Badge>
                              )}
                            </div>
                            {appointment.payment && (
                              <div className="flex items-center gap-2 text-sm text-secondary-700">
                                <DollarSign className="h-4 w-4 text-primary" />
                                <span className="font-medium">
                                  {appointment.payment.amount.toLocaleString("pt-BR", {
                                    style: "currency",
                                    currency: "BRL"
                                  })}
                                </span>
                              </div>
                            )}
                          </div>

                          {appointment.notes && (
                            <div className="pt-3 border-t border-primary/10">
                              <p className="text-sm text-secondary-600">
                                <span className="font-semibold">Observações:</span> {appointment.notes}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


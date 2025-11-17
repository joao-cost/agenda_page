import { useEffect, useMemo, useState } from "react";
import { addDays, format, isSameDay, parseISO, startOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useForm } from "react-hook-form";
import { listServices } from "../../api/services";
import { listClients } from "../../api/clients";
import {
  createAppointment,
  fetchAvailability,
  type AvailabilityResponse
} from "../../api/appointments";
import { fetchGeneralSettings } from "../../api/settings";
import type { Client, Service } from "../../types";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/Card";
import { Label } from "../../components/ui/Label";
import { Select } from "../../components/ui/Select";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Badge } from "../../components/ui/Badge";
import { useAuthStore } from "../../store/auth";
import { Link } from "react-router-dom";
import { Car, Calendar, Clock, MapPin, Sparkles, CheckCircle, XCircle, AlertCircle, DollarSign } from "lucide-react";

interface AdminAppointmentForm {
  clientId: string;
  serviceId: string;
  notes?: string;
}

const DAYS_TO_DISPLAY = 7;

export function DashboardNewAppointment() {
  const { user } = useAuthStore();
  const isAdmin = user?.role === "ADMIN";

  const [clients, setClients] = useState<Client[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(() => startOfDay(new Date()));
  const [availability, setAvailability] = useState<AvailabilityResponse | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [availabilityError, setAvailabilityError] = useState<string | null>(null);
  const [loadingAvailability, setLoadingAvailability] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [generalSettings, setGeneralSettings] = useState<{ workDays: string; closedDates: string[] } | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { isSubmitting }
  } = useForm<AdminAppointmentForm>();

  const selectedServiceId = watch("serviceId");
  const selectedClientId = watch("clientId");

  useEffect(() => {
    async function loadData() {
      try {
        const [clientsData, servicesData, settingsData] = await Promise.all([
          listClients(),
          listServices(),
          fetchGeneralSettings()
        ]);
        setClients(clientsData);
        setServices(servicesData);
        setGeneralSettings({
          workDays: settingsData.workDays,
          closedDates: settingsData.closedDates
        });
      } catch (error) {
        console.error(error);
        setErrorMessage("Não foi possível carregar clientes ou serviços.");
      }
    }
    loadData();
  }, []);

  useEffect(() => {
    if (!selectedServiceId) {
      setAvailability(null);
      setSelectedSlot(null);
      return;
    }

    async function loadAvailability() {
      setLoadingAvailability(true);
      setAvailabilityError(null);
      try {
        const data = await fetchAvailability({
          serviceId: selectedServiceId,
          date: format(selectedDate, "yyyy-MM-dd")
        });
        setAvailability(data);

        if (!data.availableSlots.includes(selectedSlot ?? "")) {
          setSelectedSlot(data.availableSlots[0] ?? null);
        }
      } catch (error) {
        console.error(error);
        setAvailability(null);
        setAvailabilityError("Não foi possível carregar a disponibilidade. Tente novamente.");
      } finally {
        setLoadingAvailability(false);
      }
    }

    loadAvailability();
  }, [selectedServiceId, selectedDate]);

  const calendarDays = useMemo(
    () => Array.from({ length: DAYS_TO_DISPLAY }, (_, index) => addDays(startOfDay(new Date()), index)),
    []
  );

  const selectedSlotDate = selectedSlot ? parseISO(selectedSlot) : null;
  const selectedService = services.find((service) => service.id === selectedServiceId);
  const selectedClient = clients.find((client) => client.id === selectedClientId);

  const onSubmit = async (data: AdminAppointmentForm) => {
    if (!selectedSlot) {
      setErrorMessage("Selecione um horário para agendar.");
      return;
    }

    setFeedback(null);
    setErrorMessage(null);
    try {
      const appointment = await createAppointment({
        clientId: data.clientId,
        serviceId: data.serviceId,
        date: selectedSlot,
        notes: data.notes
      });
      setFeedback("Agendamento criado com sucesso! O cliente foi notificado.");
      reset();
      window.dispatchEvent(
        new CustomEvent("appointment:created", { detail: { date: appointment.date } })
      );
      setSelectedSlot(null);
      setAvailability((prev) =>
        prev
          ? {
              ...prev,
              availableSlots: prev.availableSlots.filter((slot) => slot !== selectedSlot)
            }
          : prev
      );
    } catch (error) {
      console.error(error);
      setErrorMessage("Erro ao criar agendamento. Tente novamente.");
    }
  };

  if (!isAdmin) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg text-secondary-900">Acesso restrito</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-secondary-600">
            Apenas administradores podem criar agendamentos por aqui.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-white to-accent/5 py-6 md:py-10">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 sm:px-6">
        {/* Header melhorado */}
        <header className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-primary to-accent p-6 md:p-8 text-white shadow-2xl">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48Y2lyY2xlIGN4PSIzMCIgY3k9IjMwIiByPSIyMCIvPjwvZz48L2c+PC9zdmc+')] opacity-20"></div>
          <div className="relative z-10 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-yellow-300" />
                <span className="text-xs font-bold uppercase tracking-wider text-yellow-300">
                  Painel Administrativo
                </span>
              </div>
              <h1 className="text-3xl font-bold md:text-4xl lg:text-5xl">
                Criar novo agendamento
                <br />
                <span className="text-primary-foreground/90">para um cliente</span>
              </h1>
              <p className="text-sm text-primary-foreground/90 md:text-base max-w-2xl">
                Selecione o cliente, serviço, data e horário desejados. O cliente receberá notificação automática.
              </p>
            </div>
            {selectedService && selectedSlotDate && selectedClient ? (
              <div className="rounded-2xl bg-white/20 backdrop-blur-sm border border-white/30 px-6 py-4 text-white shadow-xl">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="h-4 w-4" />
                  <p className="text-xs font-semibold uppercase tracking-wide">Seleção Atual</p>
                </div>
                <p className="text-lg font-bold">
                  {selectedClient.name}
                </p>
                <p className="text-sm text-white/90 mt-1">
                  {format(selectedSlotDate, "dd 'de' MMMM", { locale: ptBR })} às {format(selectedSlotDate, "HH:mm")} · {selectedService.name}
                </p>
              </div>
            ) : null}
          </div>
        </header>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_400px]">
          {/* Card Principal - Agendamento */}
          <Card className="order-2 lg:order-1 bg-gradient-to-br from-white via-white to-primary/5 border-2 border-primary/20 shadow-xl">
            <CardHeader className="space-y-2 border-b-2 border-primary/20 pb-4">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-gradient-to-br from-primary to-accent p-2.5 shadow-lg">
                  <Calendar className="h-5 w-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-2xl font-bold text-secondary-900">Defina o melhor horário</CardTitle>
                  <p className="text-sm text-secondary-600 mt-1">
                    Escolha o cliente, serviço, dia e um horário disponível para o atendimento
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {/* Seleção de Cliente */}
                <div className="space-y-3">
                  <Label htmlFor="clientId" className="text-base font-semibold text-secondary-900 flex items-center gap-2">
                    <Car className="h-4 w-4 text-primary" />
                    Cliente
                  </Label>
                  <div className="relative">
                    <Select 
                      id="clientId" 
                      defaultValue="" 
                      {...register("clientId", { required: true })}
                      className="w-full h-12 text-base border-2 border-primary/30 focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-xl bg-white"
                    >
                      <option value="" disabled>
                        Selecione um cliente
                      </option>
                      {clients.map((client) => (
                        <option key={client.id} value={client.id}>
                          {client.name} {client.vehicle ? `• ${client.vehicle}` : ""} {client.plate ? `• ${client.plate}` : ""}
                        </option>
                      ))}
                    </Select>
                  </div>
                </div>

                {/* Seleção de Serviço */}
                <div className="space-y-3">
                  <Label htmlFor="serviceId" className="text-base font-semibold text-secondary-900 flex items-center gap-2">
                    <Car className="h-4 w-4 text-primary" />
                    Serviço desejado
                  </Label>
                  <div className="relative">
                    <Select 
                      id="serviceId" 
                      defaultValue="" 
                      {...register("serviceId", { required: true })}
                      className="w-full h-12 text-base border-2 border-primary/30 focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-xl bg-white"
                    >
                      <option value="" disabled>
                        Selecione um serviço
                      </option>
                      {services.map((service) => (
                        <option key={service.id} value={service.id}>
                          {service.name} - {service.price.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                        </option>
                      ))}
                    </Select>
                  </div>
                </div>

                <div className="space-y-5">
                  {/* Seleção de Data */}
                  <div className="space-y-3">
                    <Label className="text-base font-semibold text-secondary-900 flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-primary" />
                      Escolha o dia
                    </Label>
                    <div className="no-scrollbar relative -mx-2 flex gap-3 overflow-x-auto px-2 pb-3 pt-2">
                      {calendarDays.map((day) => {
                        const isSelected = isSameDay(day, selectedDate);
                        const isToday = isSameDay(day, new Date());
                        const dayOfWeek = day.getDay();
                        const dateString = format(day, "yyyy-MM-dd");
                        
                        const workDaysArray = generalSettings?.workDays
                          ? generalSettings.workDays.split(",").map(Number)
                          : [1, 2, 3, 4, 5, 6];
                        const isWorkDay = workDaysArray.includes(dayOfWeek);
                        
                        const closedDates = generalSettings?.closedDates || [];
                        const isClosedDate = closedDates.includes(dateString);
                        
                        const isUnavailable = !isWorkDay || isClosedDate;
                        
                        return (
                          <button
                            key={day.toISOString()}
                            type="button"
                            onClick={() => !isUnavailable && setSelectedDate(startOfDay(day))}
                            disabled={isUnavailable}
                            className={`flex min-w-[90px] flex-col items-center rounded-2xl px-4 py-4 text-sm transition-all duration-200 relative ${
                              isUnavailable
                                ? "bg-gray-100 text-gray-400 ring-2 ring-gray-300 cursor-not-allowed opacity-60"
                                : isSelected
                                ? "bg-gradient-to-br from-primary to-accent text-white shadow-xl scale-105 ring-4 ring-primary/30"
                                : isToday
                                ? "bg-gradient-to-br from-yellow-100 to-yellow-50 text-secondary-900 ring-2 ring-yellow-300 hover:ring-yellow-400"
                                : "bg-white text-secondary-700 ring-2 ring-secondary-200 hover:ring-primary/40 hover:bg-primary/5"
                            }`}
                          >
                            {isUnavailable && (
                              <div className="absolute top-2 right-2">
                                <XCircle className="h-5 w-5 text-red-500" />
                              </div>
                            )}
                            <span className={`text-xs font-bold uppercase tracking-wide ${isSelected ? "text-white/90" : isUnavailable ? "text-gray-400" : "text-secondary-500"}`}>
                              {format(day, "EEE", { locale: ptBR })}
                            </span>
                            <span className={`mt-1.5 text-2xl font-bold ${isSelected ? "text-white" : isUnavailable ? "text-gray-400" : "text-secondary-900"}`}>
                              {format(day, "dd")}
                            </span>
                            {isToday && !isUnavailable && (
                              <span className="mt-1 text-[10px] font-semibold text-yellow-600">HOJE</span>
                            )}
                            {isUnavailable && (
                              <span className="mt-1 text-[10px] font-semibold text-red-600">FECHADO</span>
                            )}
                            {!isUnavailable && !isToday && (
                              <span className="mt-1 text-[10px] font-semibold text-green-600">ABERTO</span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Seleção de Horário */}
                  <div className="space-y-3">
                    <Label className="text-base font-semibold text-secondary-900 flex items-center gap-2">
                      <Clock className="h-4 w-4 text-primary" />
                      Horários disponíveis
                    </Label>
                    {availabilityError && (
                      <div className="rounded-xl bg-red-50 border-2 border-red-200 p-4 flex items-start gap-3">
                        <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                        <p className="text-sm font-medium text-red-800">{availabilityError}</p>
                      </div>
                    )}
                    {loadingAvailability ? (
                      <div className="rounded-xl bg-blue-50 border-2 border-blue-200 p-6 text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-3"></div>
                        <p className="text-sm font-medium text-blue-800">Verificando disponibilidade...</p>
                      </div>
                    ) : !selectedServiceId ? (
                      <div className="rounded-xl bg-gradient-to-br from-primary/10 to-accent/10 border-2 border-primary/30 p-8 text-center">
                        <Clock className="h-12 w-12 text-primary/50 mx-auto mb-3" />
                        <p className="text-sm font-medium text-secondary-700">Selecione um serviço para ver os horários disponíveis</p>
                      </div>
                    ) : availability && availability.availableSlots.length === 0 ? (
                      <div className="rounded-xl bg-yellow-50 border-2 border-yellow-200 p-6 text-center">
                        <AlertCircle className="h-8 w-8 text-yellow-600 mx-auto mb-3" />
                        <p className="text-sm font-medium text-yellow-800">Nenhum horário disponível neste dia. Escolha outra data.</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                        {availability?.availableSlots.map((slot) => {
                          const slotDate = parseISO(slot);
                          const label = format(slotDate, "HH:mm");
                          const isSelected = selectedSlot === slot;
                          return (
                            <button
                              key={slot}
                              type="button"
                              onClick={() => setSelectedSlot(slot)}
                              className={`h-14 rounded-xl border-2 text-base font-bold transition-all duration-200 ${
                                isSelected
                                  ? "bg-gradient-to-br from-primary to-accent text-white shadow-xl scale-105 ring-4 ring-primary/30 border-transparent"
                                  : "border-primary/30 bg-white text-secondary-700 hover:border-primary hover:bg-primary/10 hover:scale-105 shadow-sm"
                              }`}
                            >
                              {label}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                {/* Observações */}
                <div className="space-y-3">
                  <Label htmlFor="notes" className="text-base font-semibold text-secondary-900">
                    Observações (opcional)
                  </Label>
                  <Input
                    id="notes"
                    placeholder="Informe detalhes adicionais ou preferências especiais..."
                    {...register("notes")}
                    className="h-20 text-base border-2 border-primary/30 focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-xl"
                  />
                </div>

                {/* Botão de Confirmação */}
                <Button
                  type="submit"
                  disabled={isSubmitting || loadingAvailability || !selectedServiceId || !selectedSlot || !selectedClientId}
                  className="w-full h-14 bg-gradient-to-r from-primary to-accent text-white text-lg font-bold shadow-xl hover:shadow-2xl transition-all duration-200 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <span className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      Agendando...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5" />
                      Confirmar Agendamento
                    </span>
                  )}
                </Button>

                {/* Mensagens de Feedback */}
                {feedback && (
                  <div className="rounded-xl bg-green-50 border-2 border-green-200 p-4 flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm font-medium text-green-800">{feedback}</p>
                  </div>
                )}
                {errorMessage && (
                  <div className="rounded-xl bg-red-50 border-2 border-red-200 p-4 flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm font-medium text-red-800">{errorMessage}</p>
                  </div>
                )}
              </form>
            </CardContent>
          </Card>

          {/* Card de Resumo - Sticky no desktop */}
          <div className="order-1 lg:order-2">
            <Card className="bg-gradient-to-br from-white via-white to-primary/5 border-2 border-primary/20 shadow-xl sticky top-6">
              <CardHeader className="space-y-2 border-b-2 border-primary/20 pb-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-gradient-to-br from-primary to-accent p-2.5 shadow-lg">
                    <DollarSign className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-xl font-bold text-secondary-900">Resumo do Pedido</CardTitle>
                    <p className="text-xs text-secondary-600 mt-1">
                      Verifique o valor e acompanhe o pagamento
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6 pt-6">
                {/* Cliente Selecionado */}
                <div className="space-y-2">
                  <p className="text-xs font-bold uppercase tracking-wide text-secondary-500 flex items-center gap-2">
                    <Car className="h-3 w-3" />
                    CLIENTE SELECIONADO
                  </p>
                  {selectedClient ? (
                    <div className="rounded-xl border-2 border-primary/30 bg-gradient-to-br from-primary/10 to-accent/10 p-4">
                      <p className="text-base font-bold text-secondary-900">{selectedClient.name}</p>
                      {selectedClient.vehicle && (
                        <p className="text-sm text-secondary-600 mt-1">Veículo: {selectedClient.vehicle}</p>
                      )}
                      {selectedClient.plate && (
                        <Badge className="mt-2 inline-block bg-gradient-to-r from-primary to-accent text-white text-xs font-bold">
                          {selectedClient.plate}
                        </Badge>
                      )}
                    </div>
                  ) : (
                    <div className="rounded-xl border-2 border-secondary-200 bg-secondary-50 p-6 text-center">
                      <Car className="h-8 w-8 text-secondary-400 mx-auto mb-2" />
                      <p className="text-sm text-secondary-600">Selecione um cliente para visualizar detalhes</p>
                    </div>
                  )}
                </div>

                {/* Serviço Selecionado */}
                <div className="space-y-2">
                  <p className="text-xs font-bold uppercase tracking-wide text-secondary-500 flex items-center gap-2">
                    <Car className="h-3 w-3" />
                    SERVIÇO SELECIONADO
                  </p>
                  {selectedService ? (
                    <div className="rounded-xl border-2 border-primary/30 bg-gradient-to-br from-primary/10 to-accent/10 p-4">
                      <p className="text-base font-bold text-secondary-900">{selectedService.name}</p>
                      <p className="text-sm text-secondary-600 mt-1">{selectedService.description}</p>
                      <div className="mt-4 flex items-center justify-between pt-4 border-t border-primary/20">
                        <span className="text-sm font-semibold text-secondary-700">Duração</span>
                        <span className="text-sm font-bold text-secondary-900">{selectedService.durationMin} minutos</span>
                      </div>
                      <div className="mt-2 flex items-center justify-between">
                        <span className="text-sm font-semibold text-secondary-700">Valor</span>
                        <span className="text-lg font-bold text-primary">{selectedService.price.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-xl border-2 border-secondary-200 bg-secondary-50 p-6 text-center">
                      <Car className="h-8 w-8 text-secondary-400 mx-auto mb-2" />
                      <p className="text-sm text-secondary-600">Selecione um serviço para visualizar detalhes</p>
                    </div>
                  )}
                </div>

                {/* Data e Horário */}
                {selectedSlotDate && (
                  <div className="space-y-2">
                    <p className="text-xs font-bold uppercase tracking-wide text-secondary-500 flex items-center gap-2">
                      <Calendar className="h-3 w-3" />
                      DATA E HORÁRIO
                    </p>
                    <div className="rounded-xl border-2 border-primary/30 bg-gradient-to-br from-primary/10 to-accent/10 p-4">
                      <p className="text-sm font-semibold text-secondary-700">
                        {format(selectedSlotDate, "EEEE, dd 'de' MMMM", { locale: ptBR })}
                      </p>
                      <p className="text-lg font-bold text-secondary-900 mt-1">
                        às {format(selectedSlotDate, "HH:mm")}
                      </p>
                    </div>
                  </div>
                )}

                {/* Status de Pagamento */}
                <div className="space-y-2">
                  <p className="text-xs font-bold uppercase tracking-wide text-secondary-500 flex items-center gap-2">
                    <DollarSign className="h-3 w-3" />
                    STATUS DE PAGAMENTO
                  </p>
                  <div className="rounded-xl border-2 border-blue-200 bg-blue-50 p-4">
                    <p className="text-sm text-secondary-700">
                      Pagamentos podem ser realizados na entrega ou via link enviado após a confirmação. Você receberá atualizações por WhatsApp assim que o status for alterado.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

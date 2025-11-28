import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { addDays, format, isSameDay, parseISO, startOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { listServices } from "../api/services";
import { createAppointment, fetchAvailability, listAppointments, updateAppointmentStatus, type AvailabilityResponse } from "../api/appointments";
import { fetchGeneralSettings } from "../api/settings";
import type { Appointment, Service } from "../types";
import { useAuthStore } from "../store/auth";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Label } from "../components/ui/Label";
import { Select } from "../components/ui/Select";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import { Calendar, Clock, DollarSign, CheckCircle, XCircle, AlertCircle, Sparkles, Car, MapPin } from "lucide-react";
import { ConfirmDialog } from "../components/ui/ConfirmDialog";
import { AlertDialog } from "../components/ui/AlertDialog";

interface ScheduleForm {
  serviceId: string;
  notes?: string;
}

const DAYS_TO_DISPLAY = 7;

export function SchedulePage() {
  const [services, setServices] = useState<Service[]>([]);
  const [loadingServices, setLoadingServices] = useState(true);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [availabilityError, setAvailabilityError] = useState<string | null>(null);
  const [availability, setAvailability] = useState<AvailabilityResponse | null>(null);
  const [loadingAvailability, setLoadingAvailability] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(() => startOfDay(new Date()));
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [myAppointments, setMyAppointments] = useState<Appointment[]>([]);
  const [loadingAppointments, setLoadingAppointments] = useState(false);
  const [generalSettings, setGeneralSettings] = useState<{ workDays: string; closedDates: string[] } | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    type?: "warning" | "danger" | "info" | "success";
  }>({ isOpen: false, title: "", message: "", onConfirm: () => {} });
  const [alertDialog, setAlertDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type?: "error" | "success" | "info" | "warning";
  }>({ isOpen: false, title: "", message: "" });
  const { user } = useAuthStore();
  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { isSubmitting }
  } = useForm<ScheduleForm>();

  useEffect(() => {
    async function fetchServices() {
      try {
        const data = await listServices();
        setServices(data);
      } catch (error) {
        console.error(error);
        setErrorMessage("Não foi possível carregar os serviços. Tente novamente mais tarde.");
      } finally {
        setLoadingServices(false);
      }
    }

    async function fetchSettings() {
      try {
        const settings = await fetchGeneralSettings();
        setGeneralSettings({
          workDays: settings.workDays,
          closedDates: settings.closedDates
        });
      } catch (error) {
        console.error("Erro ao carregar configurações:", error);
      }
    }

    fetchServices();
    fetchSettings();
  }, []);

  useEffect(() => {
    if (user?.clientId) {
      async function fetchMyAppointments() {
        setLoadingAppointments(true);
        try {
          const data = await listAppointments();
          // Filtrar apenas agendamentos futuros ou do dia atual
          const now = new Date();
          const filtered = data.filter((apt) => {
            const aptDate = new Date(apt.date);
            return aptDate >= now || isSameDay(aptDate, now);
          });
          setMyAppointments(filtered.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()));
        } catch (error) {
          console.error(error);
        } finally {
          setLoadingAppointments(false);
        }
      }
      fetchMyAppointments();
    }
  }, [user?.clientId]);

  const selectedServiceId = watch("serviceId");
  const selectedService = useMemo(
    () => services.find((service) => service.id === selectedServiceId),
    [services, selectedServiceId]
  );

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

  const onSubmit = async (data: ScheduleForm) => {
    if (!user?.clientId) {
      setErrorMessage("Para agendar, finalize seu cadastro como cliente.");
      return;
    }

    if (!selectedSlot) {
      setErrorMessage("Selecione uma data e horário disponíveis para continuar.");
      return;
    }

    const slotToBook = selectedSlot;

    setErrorMessage(null);
    setSuccessMessage(null);
    try {
      const appointment = await createAppointment({
        clientId: user.clientId,
        serviceId: data.serviceId,
        date: selectedSlot,
        notes: data.notes
      });
      setSuccessMessage("Agendamento realizado com sucesso! Você receberá a confirmação em instantes.");
      reset();
      window.dispatchEvent(
        new CustomEvent("appointment:created", { detail: { date: appointment.date } })
      );
      setAvailability((prev) =>
        prev
          ? {
              ...prev,
              availableSlots: prev.availableSlots.filter((slot) => slot !== slotToBook)
            }
          : prev
      );
      setSelectedSlot(null);
      // Recarregar meus agendamentos
      if (user?.clientId) {
        const data = await listAppointments();
        const now = new Date();
        const filtered = data.filter((apt) => {
          const aptDate = new Date(apt.date);
          return aptDate >= now || isSameDay(aptDate, now);
        });
        setMyAppointments(filtered.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()));
      }
    } catch (error) {
      console.error(error);
      setErrorMessage("Não foi possível concluir o agendamento. Tente novamente.");
    }
  };

  const selectedSlotDate = selectedSlot ? parseISO(selectedSlot) : null;

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
                  Agende em poucos cliques
                </span>
              </div>
              <h1 className="text-3xl font-bold md:text-4xl lg:text-5xl">
                Escolha o serviço ideal
                <br />
                <span className="text-primary-foreground/90">para o seu veículo</span>
              </h1>
              <p className="text-sm text-primary-foreground/90 md:text-base max-w-2xl">
                Selecione data e horário desejados, confirme o valor e acompanhe o status do pagamento em tempo real.
              </p>
            </div>
            {selectedService && selectedSlotDate ? (
              <div className="rounded-2xl bg-white/20 backdrop-blur-sm border border-white/30 px-6 py-4 text-white shadow-xl">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="h-4 w-4" />
                  <p className="text-xs font-semibold uppercase tracking-wide">Seleção Atual</p>
                </div>
                <p className="text-lg font-bold">
                  {format(selectedSlotDate, "dd 'de' MMMM", { locale: ptBR })}
                </p>
                <p className="text-sm text-white/90 mt-1">
                  às {format(selectedSlotDate, "HH:mm")} · {selectedService.name}
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
                    Escolha o serviço, o dia e um horário disponível para o atendimento
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
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
                  {loadingServices && (
                    <p className="text-sm text-secondary-500 flex items-center gap-2">
                      <span className="animate-spin">⏳</span>
                      Carregando serviços...
                    </p>
                  )}
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
                        const dayOfWeek = day.getDay(); // 0 = domingo, 1 = segunda, etc
                        const dateString = format(day, "yyyy-MM-dd");
                        
                        // Verificar se o dia está nos dias de trabalho
                        const workDaysArray = generalSettings?.workDays
                          ? generalSettings.workDays.split(",").map(Number)
                          : [1, 2, 3, 4, 5, 6]; // Padrão: segunda a sábado
                        const isWorkDay = workDaysArray.includes(dayOfWeek);
                        
                        // Verificar se o dia está nas datas fechadas
                        const closedDates = generalSettings?.closedDates || [];
                        const isClosedDate = closedDates.includes(dateString);
                        
                        // Dia sem atendimento: não é dia de trabalho OU está nas datas fechadas
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
                      <div className="rounded-xl bg-blue-50 border-2 border-blue-200 p-4 flex items-center gap-3">
                        <span className="animate-spin text-blue-600">⏳</span>
                        <p className="text-sm font-medium text-blue-800">Verificando disponibilidade...</p>
                      </div>
                    ) : !selectedServiceId ? (
                      <div className="rounded-xl bg-secondary-50 border-2 border-secondary-200 p-6 text-center">
                        <Clock className="h-10 w-10 text-secondary-400 mx-auto mb-3" />
                        <p className="text-sm font-medium text-secondary-600">
                          Selecione um serviço para ver os horários disponíveis
                        </p>
                      </div>
                    ) : availability && availability.availableSlots.length === 0 ? (
                      <div className="rounded-xl bg-yellow-50 border-2 border-yellow-200 p-6 text-center">
                        <AlertCircle className="h-10 w-10 text-yellow-600 mx-auto mb-3" />
                        <p className="text-sm font-medium text-yellow-800">
                          Nenhum horário disponível para este dia
                        </p>
                        <p className="text-xs text-yellow-700 mt-1">Escolha outra data</p>
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
                              className={`flex h-16 items-center justify-center rounded-xl border-2 text-base font-bold transition-all duration-200 ${
                                isSelected
                                  ? "border-primary bg-gradient-to-br from-primary to-accent text-white shadow-xl scale-105 ring-4 ring-primary/30"
                                  : "border-secondary-200 bg-white text-secondary-700 shadow-md hover:border-primary hover:bg-primary/10 hover:scale-105 hover:shadow-lg"
                              }`}
                            >
                              {label}
                            </button>
                          );
                        })}
                        {!availability && selectedServiceId ? (
                          <div className="col-span-full text-sm text-secondary-500 text-center py-4">
                            Selecione um dia para ver os horários.
                          </div>
                        ) : null}
                      </div>
                    )}
                  </div>
                </div>

                {/* Observações */}
                <div className="space-y-2">
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
                  disabled={isSubmitting || loadingServices || loadingAvailability || !selectedServiceId || !selectedSlot}
                  className="w-full h-14 text-base font-bold bg-gradient-to-r from-primary to-accent text-white shadow-xl hover:shadow-2xl hover:scale-[1.02] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                  {isSubmitting ? (
                    <span className="flex items-center gap-2">
                      <span className="animate-spin">⏳</span>
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
                {errorMessage && (
                  <div className="rounded-xl bg-red-50 border-2 border-red-200 p-4 flex items-start gap-3" role="alert">
                    <XCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm font-medium text-red-800">{errorMessage}</p>
                  </div>
                )}
                {successMessage && (
                  <div className="rounded-xl bg-green-50 border-2 border-green-200 p-4 flex items-start gap-3" role="status">
                    <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm font-medium text-green-800">{successMessage}</p>
                  </div>
                )}
              </form>
            </CardContent>
          </Card>

          {/* Card Resumo - Sidebar */}
          <Card className="order-1 lg:order-2 bg-gradient-to-br from-white via-white to-accent/5 border-2 border-accent/20 shadow-xl sticky top-6 h-fit">
            <CardHeader className="border-b-2 border-accent/20 pb-4">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-gradient-to-br from-accent to-primary p-2.5 shadow-lg">
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
              {/* Serviço Selecionado */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-secondary-500">
                  Serviço Selecionado
                </h3>
                {selectedService ? (
                  <div className="rounded-2xl bg-gradient-to-br from-primary/10 to-accent/10 border-2 border-primary/30 p-5 shadow-lg">
                    <div className="flex items-start justify-between mb-3">
                      <h4 className="text-lg font-bold text-secondary-900 flex-1">{selectedService.name}</h4>
                      <Badge className="bg-gradient-to-r from-primary to-accent text-white font-bold">
                        Selecionado
                      </Badge>
                    </div>
                    <p className="text-sm text-secondary-700 mb-4 leading-relaxed">{selectedService.description}</p>
                    
                    <div className="space-y-3 pt-4 border-t-2 border-primary/20">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-secondary-600 flex items-center gap-2">
                          <DollarSign className="h-4 w-4 text-primary" />
                          Valor
                        </span>
                        <span className="text-xl font-bold text-primary">
                          {selectedService.price.toLocaleString("pt-BR", {
                            style: "currency",
                            currency: "BRL"
                          })}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-secondary-600 flex items-center gap-2">
                          <Clock className="h-4 w-4 text-accent" />
                          Duração
                        </span>
                        <span className="text-base font-semibold text-secondary-900">{selectedService.durationMin} minutos</span>
                      </div>
                      {selectedSlotDate && (
                        <div className="flex items-center justify-between pt-2 border-t border-primary/10">
                          <span className="text-sm font-medium text-secondary-600 flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-accent" />
                            Agendado para
                          </span>
                          <span className="text-base font-bold text-secondary-900 text-right">
                            {format(selectedSlotDate, "dd/MM", { locale: ptBR })}
                            <br />
                            <span className="text-primary">{format(selectedSlotDate, "HH:mm", { locale: ptBR })}</span>
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="rounded-2xl bg-secondary-50 border-2 border-secondary-200 p-6 text-center">
                    <Car className="h-10 w-10 text-secondary-400 mx-auto mb-3" />
                    <p className="text-sm font-medium text-secondary-600">
                      Selecione um serviço para visualizar detalhes
                    </p>
                  </div>
                )}
              </div>

              {/* Status de Pagamento */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-secondary-500">
                  Status de Pagamento
                </h3>
                <div className="rounded-2xl bg-gradient-to-br from-blue-50 to-blue-100/50 border-2 border-blue-200 p-5">
                  <div className="flex items-start gap-3">
                    <div className="rounded-lg bg-blue-500 p-2">
                      <DollarSign className="h-4 w-4 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-blue-900 mb-2">
                        Pagamentos podem ser realizados na entrega ou via link enviado após a confirmação.
                      </p>
                      <p className="text-xs text-blue-700">
                        Você receberá atualizações por WhatsApp assim que o status for alterado.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Meus Agendamentos */}
          {user?.clientId && (
            <Card className="col-span-full bg-gradient-to-br from-white via-white to-accent/5 border-2 border-accent/20 shadow-xl">
              <CardHeader className="border-b-2 border-accent/20 pb-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-gradient-to-br from-accent to-primary p-2.5 shadow-lg">
                    <Calendar className="h-5 w-5 text-white" />
                  </div>
                  <CardTitle className="text-2xl font-bold text-secondary-900">Meus Agendamentos</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                {loadingAppointments ? (
                  <div className="text-center py-8">
                    <span className="animate-spin text-4xl mb-3 block">⏳</span>
                    <p className="text-sm font-medium text-secondary-600">Carregando agendamentos...</p>
                  </div>
                ) : myAppointments.length === 0 ? (
                  <div className="text-center py-12 rounded-2xl bg-secondary-50 border-2 border-secondary-200">
                    <Calendar className="h-12 w-12 text-secondary-400 mx-auto mb-3" />
                    <p className="text-sm font-medium text-secondary-600">Você não possui agendamentos</p>
                    <p className="text-xs text-secondary-500 mt-1">Faça seu primeiro agendamento acima</p>
                  </div>
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {myAppointments.map((appointment) => {
                      const appointmentDate = new Date(appointment.date);
                      const canCancel = appointment.status === "AGENDADO";
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
                      return (
                        <div
                          key={appointment.id}
                          className="rounded-2xl border-2 border-primary/20 bg-gradient-to-br from-white to-primary/5 p-5 shadow-lg hover:shadow-xl transition-all"
                        >
                          <div className="flex items-start justify-between mb-3">
                            <Badge className={`bg-gradient-to-r ${statusColors[appointment.status]} text-white font-bold shadow-md`}>
                              {statusLabels[appointment.status]}
                            </Badge>
                            {canCancel && (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="h-7 px-3 text-xs border-red-300 text-red-700 hover:bg-red-50 hover:border-red-400"
                                onClick={() => {
                                  setConfirmDialog({
                                    isOpen: true,
                                    title: "Cancelar Agendamento",
                                    message: "Tem certeza que deseja cancelar este agendamento?",
                                    type: "danger",
                                    onConfirm: async () => {
                                      try {
                                        await updateAppointmentStatus(appointment.id, "CANCELADO");
                                        const data = await listAppointments();
                                        const now = new Date();
                                        const filtered = data.filter((apt) => {
                                          const aptDate = new Date(apt.date);
                                          return aptDate >= now || isSameDay(aptDate, now);
                                        });
                                        setMyAppointments(
                                          filtered.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                                        );
                                        setConfirmDialog({ ...confirmDialog, isOpen: false });
                                      } catch (error: any) {
                                        console.error(error);
                                        setConfirmDialog({ ...confirmDialog, isOpen: false });
                                        setAlertDialog({
                                          isOpen: true,
                                          title: "Erro",
                                          message: error.response?.data?.message || "Erro ao cancelar agendamento.",
                                          type: "error"
                                        });
                                      }
                                    }
                                  });
                                }}
                              >
                                <XCircle className="h-3 w-3 mr-1" />
                                Cancelar
                              </Button>
                            )}
                          </div>
                          <h4 className="font-bold text-lg text-secondary-900 mb-2">{appointment.service.name}</h4>
                          <div className="space-y-2 text-sm">
                            <div className="flex items-center gap-2 text-secondary-700">
                              <Calendar className="h-4 w-4 text-primary" />
                              <span>{format(appointmentDate, "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}</span>
                            </div>
                            <div className="flex items-center gap-2 font-bold text-primary">
                              <DollarSign className="h-4 w-4" />
                              <span>
                                {appointment.service.price.toLocaleString("pt-BR", {
                                  style: "currency",
                                  currency: "BRL"
                                })}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}
        onConfirm={confirmDialog.onConfirm}
        title={confirmDialog.title}
        message={confirmDialog.message}
        type={confirmDialog.type}
      />

      <AlertDialog
        isOpen={alertDialog.isOpen}
        onClose={() => setAlertDialog({ ...alertDialog, isOpen: false })}
        title={alertDialog.title}
        message={alertDialog.message}
        type={alertDialog.type}
      />
    </div>
  );
}



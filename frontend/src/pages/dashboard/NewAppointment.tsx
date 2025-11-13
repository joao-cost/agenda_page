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
import type { Client, Service } from "../../types";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/Card";
import { Label } from "../../components/ui/Label";
import { Select } from "../../components/ui/Select";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Badge } from "../../components/ui/Badge";
import { useAuthStore } from "../../store/auth";
import { Link } from "react-router-dom";

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

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { isSubmitting }
  } = useForm<AdminAppointmentForm>();

  const selectedServiceId = watch("serviceId");

  useEffect(() => {
    async function loadData() {
      try {
        const [clientsData, servicesData] = await Promise.all([listClients(), listServices()]);
        setClients(clientsData);
        setServices(servicesData);
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
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-secondary-900">Novo agendamento</h1>
          <p className="text-sm text-secondary-500">
            Controle a agenda pelo painel e garanta que nenhum horário fique em aberto.
          </p>
        </div>
        <Button asChild variant="secondary">
          <Link to="/dashboard/clientes">Cadastrar novo cliente</Link>
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg text-secondary-900">Informações principais</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="clientId">Cliente</Label>
                  <Select id="clientId" defaultValue="" {...register("clientId", { required: true })}>
                    <option value="" disabled>
                      Selecionar cliente
                    </option>
                    {clients.map((client) => (
                      <option key={client.id} value={client.id}>
                        {client.name} • {client.phone}
                      </option>
                    ))}
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="serviceId">Serviço</Label>
                  <Select id="serviceId" defaultValue="" {...register("serviceId", { required: true })}>
                    <option value="" disabled>
                      Selecionar serviço
                    </option>
                    {services.map((service) => (
                      <option key={service.id} value={service.id}>
                        {service.name} — {service.durationMin} min
                      </option>
                    ))}
                  </Select>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <Label>Dia</Label>
                  <div className="no-scrollbar flex gap-3 overflow-x-auto py-3">
                    {calendarDays.map((day) => {
                      const isSelected = isSameDay(day, selectedDate);
                      return (
                        <button
                          key={day.toISOString()}
                          type="button"
                          onClick={() => setSelectedDate(startOfDay(day))}
                          className={`flex min-w-[88px] flex-col items-center rounded-2xl px-4 py-3 transition ${
                            isSelected
                              ? "bg-primary text-primary-foreground shadow-lg"
                              : "bg-white text-secondary-600 ring-1 ring-secondary-100 hover:ring-primary/40"
                          }`}
                        >
                          <span className="text-xs uppercase tracking-wide">
                            {format(day, "EEE", { locale: ptBR })}
                          </span>
                          <span className="mt-1 text-lg font-semibold">{format(day, "dd")}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Horário</Label>
                  {availabilityError && <p className="text-sm text-red-600">{availabilityError}</p>}
                  {loadingAvailability ? (
                    <p className="text-sm text-secondary-500">Verificando disponibilidade...</p>
                  ) : !selectedServiceId ? (
                    <p className="text-sm text-secondary-500">Selecione um serviço para ver os horários.</p>
                  ) : availability && availability.availableSlots.length === 0 ? (
                    <p className="text-sm text-secondary-500">
                      Nenhum horário disponível neste dia. Escolha outra data.
                    </p>
                  ) : (
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                      {availability?.availableSlots.map((slot) => {
                        const slotDate = parseISO(slot);
                        const label = format(slotDate, "HH:mm");
                        const isSelected = selectedSlot === slot;
                        return (
                          <button
                            key={slot}
                            type="button"
                            onClick={() => setSelectedSlot(slot)}
                            className={`flex h-12 items-center justify-center rounded-xl border text-sm font-semibold transition ${
                              isSelected
                                ? "border-primary bg-primary text-primary-foreground shadow-lg"
                                : "border-transparent bg-white text-secondary-600 shadow-sm hover:border-primary/40 hover:bg-primary/10"
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

              <div className="space-y-2">
                <Label htmlFor="notes">Observações para a equipe</Label>
                <Input
                  id="notes"
                  placeholder="Ex.: aplicar proteção cerâmica no interior"
                  {...register("notes")}
                />
              </div>

              <Button
                type="submit"
                disabled={
                  isSubmitting || loadingAvailability || !selectedServiceId || !selectedSlot
                }
                className="w-full"
              >
                {isSubmitting ? "Agendando..." : "Salvar agendamento"}
              </Button>

              {feedback && (
                <p className="text-sm font-medium text-primary" role="status">
                  {feedback}
                </p>
              )}
              {errorMessage && (
                <p className="text-sm font-medium text-red-600" role="alert">
                  {errorMessage}
                </p>
              )}
            </form>
          </CardContent>
        </Card>

        <Card className="bg-white">
          <CardHeader>
            <CardTitle className="text-lg text-secondary-900">Resumo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-1">
              <p className="text-xs uppercase tracking-wide text-secondary-500">Cliente</p>
              <p className="text-sm font-medium text-secondary-900">
                {clients.find((client) => client.id === watch("clientId"))?.name ?? "Selecione um cliente"}
              </p>
            </div>

            <div className="space-y-1">
              <p className="text-xs uppercase tracking-wide text-secondary-500">Serviço</p>
              {selectedService ? (
                <div className="rounded-xl border border-secondary-100 bg-primary/5 p-4">
                  <p className="text-base font-semibold text-secondary-900">{selectedService.name}</p>
                  <p className="text-sm text-secondary-600">{selectedService.description}</p>
                  <div className="mt-3 flex items-center justify-between text-sm text-secondary-500">
                    <span>Duração</span>
                    <span>{selectedService.durationMin} min</span>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-secondary-600">Selecione um serviço para ver detalhes.</p>
              )}
            </div>

            {selectedSlotDate && (
              <div className="space-y-2">
                <p className="text-xs uppercase tracking-wide text-secondary-500">Horário</p>
                <div className="rounded-lg border border-primary/20 bg-primary/10 p-4 text-sm text-secondary-700">
                  <Badge variant="secondary" className="bg-white/60 text-secondary-700">
                    {format(selectedSlotDate, "EEEE", { locale: ptBR })}
                  </Badge>
                  <p className="mt-2 text-base font-semibold text-secondary-900">
                    {format(selectedSlotDate, "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}
                  </p>
                </div>
              </div>
            )}

            <div className="rounded-xl border border-secondary-100 bg-white p-4 text-sm text-secondary-600 shadow-sm">
              <p>O cliente receberá notificação automática com o resumo do serviço e lembrete 2h antes.</p>
              <p className="mt-2 text-xs text-secondary-400">
                Dica: confirme com o cliente sobre itens pessoais no interior antes do serviço.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


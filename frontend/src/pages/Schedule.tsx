import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { addDays, format, isSameDay, parseISO, startOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { listServices } from "../api/services";
import { createAppointment, fetchAvailability, type AvailabilityResponse } from "../api/appointments";
import type { Service } from "../types";
import { useAuthStore } from "../store/auth";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Label } from "../components/ui/Label";
import { Select } from "../components/ui/Select";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";

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

    fetchServices();
  }, []);

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
    } catch (error) {
      console.error(error);
      setErrorMessage("Não foi possível concluir o agendamento. Tente novamente.");
    }
  };

  const selectedSlotDate = selectedSlot ? parseISO(selectedSlot) : null;

  return (
    <div className="h-full bg-primary/5 py-10 md:py-16 overflow-y-auto">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 sm:px-6">
        <header className="flex flex-col items-center gap-4 rounded-2xl bg-white p-6 text-center shadow-sm md:flex-row md:justify-between md:text-left">
          <div className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-primary">
              Agende em poucos cliques
            </span>
            <h1 className="text-2xl font-semibold text-secondary-900 md:text-3xl">
              Escolha o serviço ideal para o seu veículo
            </h1>
            <p className="text-sm text-secondary-600 md:text-base">
              Selecione data e horário desejados, confirme o valor e acompanhe o status do pagamento.
            </p>
          </div>
          {selectedService && selectedSlotDate ? (
            <div className="rounded-2xl bg-primary text-primary-foreground px-6 py-4 text-sm shadow-sm">
              <p className="uppercase tracking-wide">Você selecionou</p>
              <p className="mt-1 text-lg font-semibold">
                {format(selectedSlotDate, "dd 'de' MMMM", { locale: ptBR })}
              </p>
              <p className="text-primary-foreground/80">
                às {format(selectedSlotDate, "HH:mm")} · {selectedService.name}
              </p>
            </div>
          ) : null}
        </header>

        <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_330px]">
          <Card className="order-2 md:order-1">
            <CardHeader className="space-y-1">
              <CardTitle className="text-xl text-secondary-900">Defina o melhor horário</CardTitle>
              <p className="text-sm text-secondary-600">
                Escolha o serviço, o dia e um horário disponível para o atendimento.
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="serviceId">Serviço desejado</Label>
                  <Select id="serviceId" defaultValue="" {...register("serviceId", { required: true })}>
                    <option value="" disabled>
                      Selecionar serviço
                    </option>
                    {services.map((service) => (
                      <option key={service.id} value={service.id}>
                        {service.name}
                      </option>
                    ))}
                  </Select>
                  {loadingServices && <p className="text-xs text-secondary-500">Carregando serviços...</p>}
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Escolha o dia</Label>
                    <div className="no-scrollbar relative -mx-4 flex gap-3 overflow-x-auto px-4 pb-2">
                      {calendarDays.map((day) => {
                        const isSelected = isSameDay(day, selectedDate);
                        return (
                          <button
                            key={day.toISOString()}
                            type="button"
                            onClick={() => setSelectedDate(startOfDay(day))}
                            className={`flex min-w-[84px] flex-col items-center rounded-2xl px-4 py-3 text-sm transition ${
                              isSelected
                                ? "bg-primary text-primary-foreground shadow-lg"
                                : "bg-white text-secondary-600 ring-1 ring-secondary-100 hover:ring-primary/40"
                            }`}
                          >
                            <span className="text-xs uppercase tracking-wide">
                              {format(day, "EEE", { locale: ptBR })}
                            </span>
                            <span className="mt-1 text-lg font-semibold">
                              {format(day, "dd")}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Horários disponíveis</Label>
                    {availabilityError && (
                      <p className="text-sm text-red-600">{availabilityError}</p>
                    )}
                    {loadingAvailability ? (
                      <p className="text-sm text-secondary-500">Verificando disponibilidade...</p>
                    ) : !selectedServiceId ? (
                      <p className="text-sm text-secondary-500">Selecione um serviço para ver os horários.</p>
                    ) : availability && availability.availableSlots.length === 0 ? (
                      <p className="text-sm text-secondary-500">
                        Nenhum horário disponível para este dia. Escolha outra data.
                      </p>
                    ) : (
                      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                        {availability?.availableSlots.map((slot) => {
                          const slotDate = parseISO(slot);
                          const label = format(slotDate, "HH:mm");
                          const isSelected = selectedSlot === slot;
                          return (
                            <button
                              key={slot}
                              type="button"
                              onClick={() => setSelectedSlot(slot)}
                              className={`flex h-14 items-center justify-center rounded-2xl border text-base font-semibold transition ${
                                isSelected
                                  ? "border-primary bg-primary text-primary-foreground shadow-lg"
                                  : "border-transparent bg-white text-secondary-600 shadow-sm hover:border-primary/40 hover:bg-primary/10"
                              }`}
                            >
                              {label}
                            </button>
                          );
                        })}
                        {!availability && selectedServiceId ? (
                          <div className="col-span-2 text-sm text-secondary-500 sm:col-span-3">
                            Selecione um dia para ver os horários.
                          </div>
                        ) : null}
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Observações</Label>
                  <Input
                    id="notes"
                    placeholder="Informe detalhes adicionais ou preferências"
                    {...register("notes")}
                  />
                </div>

                <Button
                  type="submit"
                  disabled={isSubmitting || loadingServices || loadingAvailability || !selectedServiceId}
                  className="w-full"
                >
                  {isSubmitting ? "Agendando..." : "Confirmar agendamento"}
                </Button>

                {errorMessage && (
                  <p className="text-sm font-medium text-red-600" role="alert">
                    {errorMessage}
                  </p>
                )}
                {successMessage && (
                  <p className="text-sm font-medium text-primary" role="status">
                    {successMessage}
                  </p>
                )}
              </form>
            </CardContent>
          </Card>

          <Card className="order-1 bg-white md:order-2">
            <CardHeader>
              <CardTitle className="text-2xl text-secondary-900">Resumo do pedido</CardTitle>
              <p className="text-sm text-secondary-600">
                Verifique o valor estimado e acompanhe o status de pagamento após a confirmação.
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-secondary-500">
                  Serviço selecionado
                </h3>
                {selectedService ? (
                  <div className="rounded-lg border border-secondary-100 p-4">
                    <h4 className="text-lg font-semibold text-secondary-900">{selectedService.name}</h4>
                    <p className="text-sm text-secondary-600">{selectedService.description}</p>
                    <div className="mt-4 flex items-center justify-between text-sm text-secondary-500">
                      <span>Valor</span>
                      <span className="text-lg font-semibold text-primary">
                        {selectedService.price.toLocaleString("pt-BR", {
                          style: "currency",
                          currency: "BRL"
                        })}
                      </span>
                    </div>
                    <div className="mt-2 flex items-center justify-between text-sm text-secondary-500">
                      <span>Duração</span>
                      <span>{selectedService.durationMin} min</span>
                    </div>
                    {selectedSlotDate && (
                      <div className="mt-2 flex items-center justify-between text-sm text-secondary-500">
                        <span>Horário</span>
                        <span>
                          {format(selectedSlotDate, "dd/MM 'às' HH:mm", { locale: ptBR })}
                        </span>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-secondary-500">
                    Selecione um serviço para visualizar detalhes.
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-secondary-500">
                  Status de pagamento
                </h3>
                <div className="rounded-lg border border-secondary-100 p-4 text-sm text-secondary-600">
                  <p>Pagamentos podem ser realizados na entrega ou via link enviado após a confirmação.</p>
                  <p className="mt-2 text-xs text-secondary-400">
                    Você receberá atualizações por WhatsApp assim que o status for alterado.
                  </p>
                </div>
              </div>

              {selectedSlotDate && (
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-secondary-500">
                    Resumo rápido
                  </h3>
                  <div className="rounded-lg border border-primary/20 bg-primary/10 p-4 text-sm text-secondary-700">
                    <p>
                      <Badge variant="secondary" className="bg-white/20 text-surface">
                        {format(selectedSlotDate, "EEEE", { locale: ptBR })}
                      </Badge>
                    </p>
                    <p className="mt-2 font-medium text-secondary-900">
                      {format(selectedSlotDate, "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}



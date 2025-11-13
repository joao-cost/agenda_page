import { useEffect, useMemo, useState } from "react";
import { addDays, format, isSameDay, parseISO, startOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useForm } from "react-hook-form";
import { listServices } from "../../api/services";
import { listClients } from "../../api/clients";
import { createAppointment, fetchAvailability, type AvailabilityResponse } from "../../api/appointments";
import type { Client, Service } from "../../types";
import { Modal } from "../ui/Modal";
import { Label } from "../ui/Label";
import { Select } from "../ui/Select";
import { Button } from "../ui/Button";
import { Textarea } from "../ui/Textarea";
import { Badge } from "../ui/Badge";

interface NewAppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialDate?: Date;
  onSuccess?: () => void;
}

interface AppointmentForm {
  clientId: string;
  serviceId: string;
  notes?: string;
}

const DAYS_TO_DISPLAY = 7;

export function NewAppointmentModal({ isOpen, onClose, initialDate, onSuccess }: NewAppointmentModalProps) {
  const [clients, setClients] = useState<Client[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(() => initialDate ? startOfDay(initialDate) : startOfDay(new Date()));
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
  } = useForm<AppointmentForm>();

  const selectedServiceId = watch("serviceId");

  useEffect(() => {
    if (isOpen) {
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
    }
  }, [isOpen]);

  useEffect(() => {
    if (initialDate) {
      setSelectedDate(startOfDay(initialDate));
    }
  }, [initialDate]);

  useEffect(() => {
    if (!selectedServiceId || !isOpen) {
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
  }, [selectedServiceId, selectedDate, isOpen]);

  const calendarDays = useMemo(
    () => Array.from({ length: DAYS_TO_DISPLAY }, (_, index) => addDays(startOfDay(new Date()), index)),
    []
  );

  const selectedSlotDate = selectedSlot ? parseISO(selectedSlot) : null;
  const selectedService = services.find((service) => service.id === selectedServiceId);

  const onSubmit = async (data: AppointmentForm) => {
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
      setFeedback("Agendamento criado com sucesso!");
      reset();
      setSelectedSlot(null);
      window.dispatchEvent(
        new CustomEvent("appointment:created", { detail: { date: appointment.date } })
      );
      setTimeout(() => {
        onClose();
        onSuccess?.();
      }, 1500);
    } catch (error: any) {
      console.error(error);
      setErrorMessage(error.response?.data?.message || "Erro ao criar agendamento. Tente novamente.");
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Novo Agendamento" size="lg">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="clientId">Cliente *</Label>
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
            <Label htmlFor="serviceId">Serviço *</Label>
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
                    className={`flex min-w-[88px] flex-col items-center rounded-xl px-4 py-3 transition-all ${
                      isSelected
                        ? "bg-gradient-to-r from-primary to-accent text-white shadow-lg"
                        : "bg-white text-secondary-600 border-2 border-primary/20 hover:border-primary/40"
                    }`}
                  >
                    <span className="text-xs uppercase tracking-wide font-semibold">
                      {format(day, "EEE", { locale: ptBR })}
                    </span>
                    <span className="mt-1 text-lg font-bold">{format(day, "dd")}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Horário *</Label>
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
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5">
                {availability?.availableSlots.map((slot) => {
                  const slotDate = parseISO(slot);
                  const isSelected = selectedSlot === slot;
                  return (
                    <button
                      key={slot}
                      type="button"
                      onClick={() => setSelectedSlot(slot)}
                      className={`rounded-lg border-2 px-3 py-2 text-sm font-semibold transition-all ${
                        isSelected
                          ? "border-primary bg-gradient-to-r from-primary to-accent text-white shadow-md"
                          : "border-primary/20 bg-white text-secondary-700 hover:border-primary/40 hover:bg-primary/10"
                      }`}
                    >
                      {format(slotDate, "HH:mm")}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {selectedService && selectedSlotDate && (
            <div className="rounded-xl border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10 p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-secondary-900">Resumo</span>
                <Badge className="bg-gradient-to-r from-primary to-accent text-white">
                  {selectedService.durationMin} min
                </Badge>
              </div>
              <p className="text-sm text-secondary-700">
                <strong>{selectedService.name}</strong>
              </p>
              <p className="text-sm font-bold text-primary mt-1">
                {selectedService.price.toLocaleString("pt-BR", {
                  style: "currency",
                  currency: "BRL"
                })}
              </p>
              <p className="text-xs text-secondary-600 mt-2">
                {format(selectedSlotDate, "EEEE, dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}
              </p>
            </div>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="notes">Observações (opcional)</Label>
          <Textarea
            id="notes"
            rows={3}
            {...register("notes")}
            placeholder="Adicione observações sobre este agendamento..."
            className="resize-none"
          />
        </div>

        {feedback && (
          <div className="rounded-xl bg-green-50 border-2 border-green-200 p-4 text-green-800">
            <p className="font-semibold">{feedback}</p>
          </div>
        )}

        {errorMessage && (
          <div className="rounded-xl bg-red-50 border-2 border-red-200 p-4 text-red-800">
            <p className="font-semibold">{errorMessage}</p>
          </div>
        )}

        <div className="flex gap-3 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="flex-1 border-primary/30"
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting || !selectedSlot}
            className="flex-1 bg-gradient-to-r from-primary to-accent text-white shadow-lg"
          >
            {isSubmitting ? "Criando..." : "Criar Agendamento"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}


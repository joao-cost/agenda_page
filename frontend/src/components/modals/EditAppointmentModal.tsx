import { useEffect, useMemo, useState } from "react";
import { addDays, format, isSameDay, parseISO, startOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useForm } from "react-hook-form";
import { listServices } from "../../api/services";
import { updateAppointment, fetchAvailability, type AvailabilityResponse } from "../../api/appointments";
import type { Appointment, Service } from "../../types";
import { Modal } from "../ui/Modal";
import { Label } from "../ui/Label";
import { Select } from "../ui/Select";
import { Button } from "../ui/Button";
import { Textarea } from "../ui/Textarea";
import { Badge } from "../ui/Badge";

interface EditAppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointment: Appointment | null;
  onSuccess?: () => void;
}

interface AppointmentForm {
  serviceId: string;
  notes?: string;
}

const DAYS_TO_DISPLAY = 7;

export function EditAppointmentModal({ isOpen, onClose, appointment, onSuccess }: EditAppointmentModalProps) {
  const [services, setServices] = useState<Service[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(() => 
    appointment ? startOfDay(new Date(appointment.date)) : startOfDay(new Date())
  );
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
    setValue,
    formState: { isSubmitting }
  } = useForm<AppointmentForm>();

  const selectedServiceId = watch("serviceId");

  useEffect(() => {
    if (isOpen && appointment) {
      async function loadData() {
        try {
          const servicesData = await listServices();
          setServices(servicesData);
          setValue("serviceId", appointment.serviceId);
          setValue("notes", appointment.notes || "");
          setSelectedDate(startOfDay(new Date(appointment.date)));
          setSelectedSlot(appointment.date);
        } catch (error) {
          console.error(error);
          setErrorMessage("Não foi possível carregar os dados.");
        }
      }
      loadData();
    }
  }, [isOpen, appointment, setValue]);

  useEffect(() => {
    if (!selectedServiceId || !isOpen || !appointment) {
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

        // Se o slot atual não está disponível, manter o slot original se possível
        const currentSlot = appointment.date;
        if (data.availableSlots.includes(currentSlot)) {
          setSelectedSlot(currentSlot);
        } else if (data.availableSlots.length > 0) {
          setSelectedSlot(data.availableSlots[0]);
        } else {
          setSelectedSlot(null);
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
  }, [selectedServiceId, selectedDate, isOpen, appointment]);

  const calendarDays = useMemo(
    () => Array.from({ length: DAYS_TO_DISPLAY }, (_, index) => addDays(startOfDay(new Date()), index)),
    []
  );

  const selectedSlotDate = selectedSlot ? parseISO(selectedSlot) : null;
  const selectedService = services.find((service) => service.id === selectedServiceId);

  const onSubmit = async (data: AppointmentForm) => {
    if (!selectedSlot || !appointment) {
      setErrorMessage("Selecione um horário válido.");
      return;
    }

    setFeedback(null);
    setErrorMessage(null);
    try {
      await updateAppointment(appointment.id, {
        serviceId: data.serviceId !== appointment.serviceId ? data.serviceId : undefined,
        date: selectedSlot !== appointment.date ? selectedSlot : undefined,
        notes: data.notes !== appointment.notes ? data.notes : undefined
      });
      setFeedback("Agendamento atualizado com sucesso!");
      setTimeout(() => {
        onClose();
        onSuccess?.();
      }, 1500);
    } catch (error: any) {
      console.error(error);
      setErrorMessage(error.response?.data?.message || "Erro ao atualizar agendamento. Tente novamente.");
    }
  };

  if (!appointment) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Editar Agendamento" size="lg">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="serviceId">Serviço *</Label>
          <Select id="serviceId" {...register("serviceId", { required: true })}>
            {services.map((service) => (
              <option key={service.id} value={service.id}>
                {service.name} — {service.durationMin} min
              </option>
            ))}
          </Select>
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
                  const isOriginalSlot = slot === appointment.date;
                  return (
                    <button
                      key={slot}
                      type="button"
                      onClick={() => setSelectedSlot(slot)}
                      className={`rounded-lg border-2 px-3 py-2 text-sm font-semibold transition-all relative ${
                        isSelected
                          ? "border-primary bg-gradient-to-r from-primary to-accent text-white shadow-md"
                          : isOriginalSlot
                          ? "border-primary/50 bg-primary/10 text-primary"
                          : "border-primary/20 bg-white text-secondary-700 hover:border-primary/40 hover:bg-primary/10"
                      }`}
                    >
                      {format(slotDate, "HH:mm")}
                      {isOriginalSlot && !isSelected && (
                        <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-primary"></span>
                      )}
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
            {isSubmitting ? "Salvando..." : "Salvar Alterações"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}


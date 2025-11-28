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
import { Calendar, Clock, DollarSign, Sparkles, CheckCircle, XCircle } from "lucide-react";

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
      <div className="space-y-6">
        {/* Header melhorado */}
        <div className="flex items-center gap-3 pb-4 border-b-2 border-primary/20">
          <div className="rounded-xl bg-gradient-to-br from-primary to-accent p-2.5 shadow-lg">
            <Calendar className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-secondary-900">Editar Agendamento</h3>
            <p className="text-xs text-secondary-600 mt-1">
              Cliente: {appointment.client.name}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="serviceId" className="text-sm font-semibold text-secondary-900 flex items-center gap-2">
              <Sparkles className="h-3 w-3 text-primary" />
              Serviço *
            </Label>
            <Select 
              id="serviceId" 
              {...register("serviceId", { required: true })}
              className="h-12 border-2 border-primary/30 focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-xl"
            >
              {services.map((service) => (
                <option key={service.id} value={service.id}>
                  {service.name} — {service.durationMin} min
                </option>
              ))}
            </Select>
          </div>

          <div className="space-y-4">
            <div>
              <Label className="text-sm font-semibold text-secondary-900 flex items-center gap-2 mb-3">
                <Calendar className="h-3 w-3 text-primary" />
                Dia
              </Label>
              <div className="no-scrollbar flex gap-3 overflow-x-auto py-3">
                {calendarDays.map((day) => {
                  const isSelected = isSameDay(day, selectedDate);
                  return (
                    <button
                      key={day.toISOString()}
                      type="button"
                      onClick={() => setSelectedDate(startOfDay(day))}
                      className={`flex min-w-[88px] flex-col items-center rounded-xl px-4 py-3 transition-all shadow-md hover:shadow-lg ${
                        isSelected
                          ? "bg-gradient-to-r from-primary to-accent text-white"
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
              <Label className="text-sm font-semibold text-secondary-900 flex items-center gap-2">
                <Clock className="h-3 w-3 text-primary" />
                Horário *
              </Label>
              {availabilityError && (
                <div className="rounded-xl bg-red-50 border-2 border-red-200 p-3">
                  <p className="text-sm text-red-800">{availabilityError}</p>
                </div>
              )}
              {loadingAvailability ? (
                <div className="text-center py-8 rounded-xl bg-secondary-50 border-2 border-secondary-200">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-3"></div>
                  <p className="text-sm text-secondary-600">Verificando disponibilidade...</p>
                </div>
              ) : !selectedServiceId ? (
                <div className="text-center py-8 rounded-xl bg-secondary-50 border-2 border-secondary-200">
                  <p className="text-sm text-secondary-600">Selecione um serviço para ver os horários.</p>
                </div>
              ) : availability && availability.availableSlots.length === 0 ? (
                <div className="text-center py-8 rounded-xl bg-yellow-50 border-2 border-yellow-200">
                  <p className="text-sm text-yellow-800">
                    Nenhum horário disponível neste dia. Escolha outra data.
                  </p>
                </div>
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
                        className={`rounded-xl border-2 px-3 py-2.5 text-sm font-semibold transition-all relative shadow-md hover:shadow-lg ${
                          isSelected
                            ? "border-primary bg-gradient-to-r from-primary to-accent text-white"
                            : isOriginalSlot
                            ? "border-primary/50 bg-primary/10 text-primary"
                            : "border-primary/20 bg-white text-secondary-700 hover:border-primary/40 hover:bg-primary/10"
                        }`}
                      >
                        {format(slotDate, "HH:mm")}
                        {isOriginalSlot && !isSelected && (
                          <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-primary border-2 border-white"></span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {selectedService && selectedSlotDate && (
              <div className="rounded-2xl border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5 p-5 shadow-lg">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-bold text-secondary-900 uppercase tracking-wide">Resumo</span>
                  <Badge className="bg-gradient-to-r from-primary to-accent text-white font-bold">
                    {selectedService.durationMin} min
                  </Badge>
                </div>
                <div className="space-y-3">
                  <div>
                    <p className="text-base font-bold text-secondary-900">{selectedService.name}</p>
                    {selectedService.description && (
                      <p className="text-sm text-secondary-600 mt-1">{selectedService.description}</p>
                    )}
                  </div>
                  <div className="flex items-center justify-between pt-3 border-t border-primary/10">
                    <div className="flex items-center gap-2 text-sm text-secondary-600">
                      <DollarSign className="h-4 w-4 text-primary" />
                      <span className="font-medium">Valor</span>
                    </div>
                    <span className="text-lg font-bold text-primary">
                      {selectedService.price.toLocaleString("pt-BR", {
                        style: "currency",
                        currency: "BRL"
                      })}
                    </span>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-primary/10">
                    <div className="flex items-center gap-2 text-sm text-secondary-600">
                      <Clock className="h-4 w-4 text-primary" />
                      <span className="font-medium">Data/Hora</span>
                    </div>
                    <span className="text-sm font-bold text-secondary-900 text-right">
                      {format(selectedSlotDate, "dd/MM/yyyy", { locale: ptBR })}
                      <br />
                      <span className="text-primary">{format(selectedSlotDate, "HH:mm", { locale: ptBR })}h</span>
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes" className="text-sm font-semibold text-secondary-900">
              Observações (opcional)
            </Label>
            <Textarea
              id="notes"
              rows={3}
              {...register("notes")}
              placeholder="Adicione observações sobre este agendamento..."
              className="resize-none border-2 border-primary/30 focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-xl"
            />
          </div>

          {feedback && (
            <div className="rounded-xl bg-green-50 border-2 border-green-200 p-4 flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm font-medium text-green-800">{feedback}</p>
            </div>
          )}

          {errorMessage && (
            <div className="rounded-xl bg-red-50 border-2 border-red-200 p-4 flex items-start gap-3">
              <XCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm font-medium text-red-800">{errorMessage}</p>
            </div>
          )}

          <div className="flex gap-3 pt-4 border-t-2 border-primary/20">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1 h-12 border-2 border-secondary-300 hover:bg-secondary-50"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !selectedSlot}
              className="flex-1 h-12 bg-gradient-to-r from-primary to-accent text-white shadow-xl hover:shadow-2xl hover:scale-[1.02] transition-all duration-200 font-bold"
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Salvando...
                </span>
              ) : (
                "Salvar Alterações"
              )}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
}

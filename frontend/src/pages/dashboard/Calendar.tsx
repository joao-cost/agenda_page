import { useEffect, useMemo, useState, useCallback } from "react";
import {
  addDays,
  addMonths,
  eachDayOfInterval,
  endOfDay,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  parseISO,
  startOfDay,
  startOfMonth,
  startOfWeek,
  subDays,
  subMonths
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { listAppointments, type Appointment } from "../../api/appointments";
import { fetchGeneralSettings, type GeneralSettings, type Washer } from "../../api/settings";
import { Button } from "../../components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import { NewAppointmentModal } from "../../components/modals/NewAppointmentModal";
import { AppointmentDetailsModal } from "../../components/modals/AppointmentDetailsModal";
import { EditAppointmentModal } from "../../components/modals/EditAppointmentModal";
import { calculateAppointmentLayout } from "../../utils/calendarLayout";

const WORK_START_HOUR = 8;
const WORK_END_HOUR = 18;

function groupAppointmentsByDay(appointments: Appointment[]) {
  // Filtrar agendamentos cancelados antes de agrupar
  const activeAppointments = appointments.filter((apt) => apt.status !== "CANCELADO");
  return activeAppointments.reduce<Record<string, Appointment[]>>((acc, appointment) => {
    const dayKey = format(new Date(appointment.date), "yyyy-MM-dd");
    acc[dayKey] = acc[dayKey] ? [...acc[dayKey], appointment] : [appointment];
    return acc;
  }, {});
}

export function DashboardCalendar() {
  const [anchorDate, setAnchorDate] = useState(new Date());
  const [monthCursor, setMonthCursor] = useState(new Date());
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isNewAppointmentOpen, setIsNewAppointmentOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [settings, setSettings] = useState<GeneralSettings | null>(null);

  useEffect(() => {
    async function loadSettings() {
      try {
        const data = await fetchGeneralSettings();
        setSettings(data);
      } catch (err) {
        console.error("Erro ao carregar configurações:", err);
      }
    }
    loadSettings();
  }, []);

  const isMultiWasherMode = settings?.multiWasher && settings?.washers && settings.washers.length > 0;

  const visibleRange = useMemo(() => {
    if (isMultiWasherMode) {
      // No modo multi-lavador, mostra apenas o dia selecionado
      const start = startOfDay(anchorDate);
      const end = startOfDay(anchorDate);
      return { start, end };
    } else {
      // Modo normal: semana
      const start = startOfWeek(anchorDate, { weekStartsOn: 1 });
      const end = endOfWeek(anchorDate, { weekStartsOn: 1 });
      return { start, end };
    }
  }, [anchorDate, isMultiWasherMode]);

  // Serializar anchorDate para garantir detecção de mudanças
  const anchorDateString = format(anchorDate, "yyyy-MM-dd");

  const loadAppointments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Calcular o range dinamicamente baseado no anchorDate atual
      let start: Date;
      let end: Date;

      if (isMultiWasherMode) {
        start = startOfDay(anchorDate);
        end = endOfDay(anchorDate); // Fim do dia, não início!
      } else {
        start = startOfWeek(anchorDate, { weekStartsOn: 1 });
        end = endOfWeek(anchorDate, { weekStartsOn: 1 });
      }

      const data = await listAppointments({
        start: start.toISOString(),
        end: end.toISOString()
      });
      // Filtrar agendamentos cancelados
      const filteredData = data.filter((apt) => apt.status !== "CANCELADO");
      setAppointments(
        filteredData.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      );
    } catch (err) {
      console.error("Erro ao carregar agendamentos:", err);
      setError("Não foi possível carregar os agendamentos.");
    } finally {
      setLoading(false);
    }
  }, [anchorDateString, isMultiWasherMode, anchorDate]);

  useEffect(() => {
    loadAppointments();
  }, [loadAppointments]);

  const daysOfWeek = useMemo(
    () =>
      isMultiWasherMode
        ? [anchorDate] // No modo multi-lavador, apenas o dia selecionado
        : eachDayOfInterval({
          start: visibleRange.start,
          end: visibleRange.end
        }),
    [visibleRange, anchorDate, isMultiWasherMode]
  );

  const appointmentsByDay = useMemo(
    () => groupAppointmentsByDay(appointments),
    [appointments]
  );

  const appointmentsByWasher = useMemo(() => {
    if (!isMultiWasherMode || !settings?.washers) return {};
    const dayKey = format(anchorDate, "yyyy-MM-dd");
    const dayAppointments = appointmentsByDay[dayKey] || [];

    const result: Record<string, Appointment[]> = {};
    settings.washers.forEach((washer) => {
      result[washer.id] = dayAppointments.filter((apt) => apt.washerId === washer.id);
    });

    return result;
  }, [appointmentsByDay, anchorDate, isMultiWasherMode, settings?.washers]);

  const hours = useMemo(() => {
    const list: number[] = [];
    for (let hour = WORK_START_HOUR; hour < WORK_END_HOUR; hour++) {
      list.push(hour);
    }
    return list;
  }, []);

  const monthDays = useMemo(() => {
    const start = startOfWeek(startOfMonth(monthCursor), { weekStartsOn: 1 });
    const end = endOfWeek(endOfMonth(monthCursor), { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
  }, [monthCursor]);

  // Preparar lista de colunas para renderizar (apenas Lavadores)
  const columnsToRender = useMemo(() => {
    if (!settings?.washers) return [];
    return settings.washers;
  }, [settings?.washers]);

  return (
    <div className="h-full flex flex-col gap-6 lg:flex-row overflow-hidden">
      <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-2 border-blue-300/30 shadow-xl lg:w-72 flex-shrink-0 h-full flex flex-col overflow-hidden">
        <CardHeader className="space-y-4 border-b border-primary/20 pb-4 flex-shrink-0">
          <CardTitle className="text-xl font-bold text-secondary-900">Agenda</CardTitle>
          <Button
            onClick={() => setIsNewAppointmentOpen(true)}
            className="w-full bg-gradient-to-r from-primary to-accent text-white shadow-lg"
          >
            Novo agendamento
          </Button>
        </CardHeader>
        <CardContent className="space-y-6 pt-6 flex-1 overflow-y-auto">
          <div className="flex items-center justify-between rounded-xl bg-white/50 p-2 border border-primary/20">
            <Button
              type="button"
              variant="secondary"
              className="px-3 py-2 h-8 w-8 rounded-lg hover:bg-primary/20 border-primary/30"
              onClick={() => setMonthCursor((date) => subMonths(date, 1))}
            >
              ←
            </Button>
            <span className="text-sm font-bold text-secondary-900">
              {format(monthCursor, "MMM yyyy", { locale: ptBR })}
            </span>
            <Button
              type="button"
              variant="secondary"
              className="px-3 py-2 h-8 w-8 rounded-lg hover:bg-primary/20 border-primary/30"
              onClick={() => setMonthCursor((date) => addMonths(date, 1))}
            >
              →
            </Button>
          </div>

          <div className="grid grid-cols-7 gap-2 text-center text-xs font-bold uppercase text-secondary-600 mb-2">
            {["S", "T", "Q", "Q", "S", "S", "D"].map((day, index) => (
              <span key={`day-${index}`} className="py-1">{day}</span>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-2">
            {monthDays.map((day) => {
              const dayKey = format(day, "yyyy-MM-dd");
              const isCurrentMonth = isSameMonth(day, monthCursor);
              const isSelected = isSameDay(day, anchorDate);
              const hasAppointments = appointmentsByDay[dayKey]?.length;
              const isToday = isSameDay(day, new Date());
              return (
                <button
                  key={day.toISOString()}
                  type="button"
                  onClick={() => {
                    setAnchorDate(day);
                    setMonthCursor(day);
                  }}
                  className={`relative flex h-10 w-10 items-center justify-center rounded-lg border-2 transition-all ${isSelected
                    ? "border-primary bg-gradient-to-r from-primary to-accent text-white shadow-lg shadow-primary/30 scale-105"
                    : isToday
                      ? "border-primary/50 bg-primary/10 text-primary font-bold ring-2 ring-primary/30"
                      : "border-transparent bg-white/50 text-secondary-700 hover:border-primary/40 hover:bg-primary/10 hover:scale-105"
                    } ${!isCurrentMonth ? "opacity-40" : ""}`}
                >
                  <span className="text-sm font-semibold">{format(day, "d")}</span>
                  {hasAppointments && !isSelected ? (
                    <span className="absolute bottom-1 left-1/2 -translate-x-1/2 h-1.5 w-1.5 rounded-full bg-primary"></span>
                  ) : null}
                </button>
              );
            })}
          </div>

          <div className="space-y-3 rounded-xl bg-white/50 p-4 border border-primary/20">
            <p className="font-bold text-secondary-900 text-sm">Legenda</p>
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-gradient-to-r from-primary to-accent shadow-md"></span>
              <span className="text-xs text-secondary-700">Agendamentos confirmados</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-secondary-300"></span>
              <span className="text-xs text-secondary-700">Disponível</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-white via-white to-primary/5 border-2 border-primary/20 shadow-xl flex-1 flex flex-col min-w-0">
        <CardHeader className="flex flex-col gap-3 border-b border-primary/20 pb-4 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle className="text-xl font-bold text-secondary-900">
              {isMultiWasherMode ? "Agenda Diária" : "Semana da agenda"}
            </CardTitle>
            <p className="text-sm text-secondary-600 font-medium">
              {isMultiWasherMode
                ? format(anchorDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
                : `${format(visibleRange.start, "dd MMM", { locale: ptBR })} – ${format(visibleRange.end, "dd MMM yyyy", { locale: ptBR })}`}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {isMultiWasherMode ? (
              <>
                <Button
                  type="button"
                  variant="secondary"
                  className="border-primary/30 hover:bg-primary/10"
                  onClick={() => {
                    const newDate = new Date(anchorDate);
                    newDate.setDate(newDate.getDate() - 1);
                    setAnchorDate(newDate);
                  }}
                >
                  Dia anterior
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  className="border-primary/30 hover:bg-primary/10"
                  onClick={() => {
                    const newDate = new Date(anchorDate);
                    newDate.setDate(newDate.getDate() + 1);
                    setAnchorDate(newDate);
                  }}
                >
                  Próximo dia
                </Button>
              </>
            ) : (
              <>
                <Button
                  type="button"
                  variant="secondary"
                  className="border-primary/30 hover:bg-primary/10"
                  onClick={() => {
                    const newDate = new Date(anchorDate);
                    newDate.setDate(newDate.getDate() - 7);
                    setAnchorDate(newDate);
                  }}
                >
                  Semana anterior
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  className="border-primary/30 hover:bg-primary/10"
                  onClick={() => {
                    const newDate = new Date(anchorDate);
                    newDate.setDate(newDate.getDate() + 7);
                    setAnchorDate(newDate);
                  }}
                >
                  Próxima semana
                </Button>
              </>
            )}
            <Button
              type="button"
              className="bg-gradient-to-r from-primary to-accent text-white shadow-lg hover:shadow-xl"
              onClick={() => setAnchorDate(new Date())}
            >
              Hoje
            </Button>
          </div>
        </CardHeader>
        <CardContent className="overflow-auto flex-1 p-0">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-sm text-secondary-500">Carregando agenda...</p>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          ) : (
            <div className="min-w-[720px]">
              {isMultiWasherMode && settings?.washers ? (
                <>
                  <div
                    className="grid gap-0 border-b-2 border-primary/20 sticky top-0 bg-white z-50 shadow-md"
                    style={{
                      gridTemplateColumns: `80px repeat(${columnsToRender.length}, minmax(0, 1fr))`
                    }}
                  >
                    <div className="bg-white border-r-2 border-primary/20"></div>
                    {columnsToRender.map((washer) => (
                      <div
                        key={washer.id}
                        className="border-r-2 border-primary/20 px-3 py-3 text-center bg-secondary text-white last:border-r-0"
                      >
                        <p className="text-[10px] uppercase tracking-wider font-bold text-primary-200 opacity-90">
                          Lavador
                        </p>
                        <p className="text-lg font-bold tracking-tight">
                          {washer.name}
                        </p>
                      </div>
                    ))}
                  </div>

                  <div
                    className="grid gap-0"
                    style={{
                      gridTemplateColumns: `80px repeat(${columnsToRender.length}, minmax(0, 1fr))`
                    }}
                  >
                    <div className="flex flex-col border-r-2 border-primary/20">
                      {hours.map((hour) => (
                        <div key={hour} className="h-20 border-b border-primary/10 px-3 py-2 bg-gradient-to-br from-primary/5 to-transparent">
                          <span className="text-xs font-bold text-secondary-600">
                            {String(hour).padStart(2, "0")}:00
                          </span>
                        </div>
                      ))}
                    </div>

                    {columnsToRender.map((washer) => {
                      const washerAppointments = appointmentsByWasher[washer.id] || [];
                      const layoutAppointments = calculateAppointmentLayout(washerAppointments);

                      return (
                        <div
                          key={washer.id}
                          className="relative border-r-2 border-primary/20 bg-primary/5 last:border-r-0"
                        >
                          {hours.map((hour) => (
                            <div
                              key={hour}
                              className="h-20 border-b border-primary/10"
                            />
                          ))}

                          <div className="absolute inset-0">
                            {/* Linha do horário atual */}
                            {isSameDay(anchorDate, new Date()) && (() => {
                              const now = new Date();
                              const currentMinutes = (now.getHours() - WORK_START_HOUR) * 60 + now.getMinutes();
                              const currentTop = (currentMinutes / ((WORK_END_HOUR - WORK_START_HOUR) * 60)) * 100;

                              if (currentTop >= 0 && currentTop <= 100) {
                                return (
                                  <div
                                    className="absolute left-0 right-0 z-20 pointer-events-none"
                                    style={{ top: `${currentTop}%` }}
                                  >
                                    <div className="h-0.5 bg-red-500 shadow-lg shadow-red-500/50" />
                                    <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-3 h-3 bg-red-500 rounded-full border-2 border-white shadow-md" />
                                  </div>
                                );
                              }
                              return null;
                            })()}

                            {layoutAppointments.map((appointment) => {
                              const startDate = new Date(appointment.date);
                              const endDate = new Date(startDate);
                              endDate.setMinutes(endDate.getMinutes() + appointment.service.durationMin);

                              const startMinutes =
                                (startDate.getHours() - WORK_START_HOUR) * 60 + startDate.getMinutes();
                              const duration = appointment.service.durationMin;

                              const top = (startMinutes / ((WORK_END_HOUR - WORK_START_HOUR) * 60)) * 100;
                              const height =
                                (duration / ((WORK_END_HOUR - WORK_START_HOUR) * 60)) * 100;

                              return (
                                <div
                                  key={appointment.id}
                                  onClick={() => {
                                    setSelectedAppointment(appointment);
                                    setIsDetailsOpen(true);
                                  }}
                                  className="absolute rounded-xl border border-primary/30 bg-white/90 p-2 text-xs shadow-sm hover:shadow-xl transition-all cursor-pointer hover:scale-[1.02] z-10 overflow-hidden flex flex-col gap-0.5 group"
                                  style={{
                                    top: `${top}%`,
                                    height: `${Math.max(height, 12)}%`,
                                    left: appointment.style.left,
                                    width: appointment.style.width
                                  }}
                                >
                                  {/* Barra lateral colorida baseada no status (opcional, mas ajuda visualmente) */}
                                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-l-xl" />

                                  <div className="pl-2 flex flex-col h-full">
                                    <div className="flex justify-between items-start">
                                      <p className="text-[10px] font-bold text-secondary-500 leading-tight">
                                        {format(startDate, "HH:mm")} - {format(endDate, "HH:mm")}
                                      </p>
                                    </div>

                                    <p className="text-xs font-extrabold text-secondary-900 uppercase tracking-tight leading-tight mt-0.5 truncate">
                                      {appointment.service.name}
                                    </p>

                                    <p className="text-[10px] text-secondary-600 truncate mt-0.5">
                                      <span className="font-semibold">{appointment.client.vehicle}</span>
                                      {appointment.client.plate && <span className="opacity-75"> ({appointment.client.plate})</span>}
                                    </p>

                                    <p className="text-[10px] text-secondary-500 truncate font-medium">
                                      {appointment.client.name}
                                    </p>

                                    <div className="mt-auto pt-1 flex justify-end">
                                      <span className="inline-block px-1.5 py-0.5 rounded text-[8px] font-bold bg-secondary-100 text-secondary-800 border border-secondary-200 uppercase tracking-wider">
                                        {appointment.status}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              ) : (
                <>
                  <div className="grid grid-cols-[80px_repeat(7,minmax(0,1fr))] gap-0 border-b-2 border-primary/20 sticky top-0 bg-white z-10">
                    <div className="bg-gradient-to-br from-primary/10 to-primary/5 border-r-2 border-primary/20"></div>
                    {daysOfWeek.map((day) => {
                      const isToday = isSameDay(day, new Date());
                      const isSelected = isSameDay(day, anchorDate);
                      return (
                        <div
                          key={day.toISOString()}
                          className={`border-r-2 border-primary/20 px-3 py-3 text-center ${isToday || isSelected
                            ? "bg-gradient-to-br from-primary/20 to-primary/10"
                            : "bg-gradient-to-br from-primary/10 to-primary/5"
                            }`}
                        >
                          <p className="text-xs uppercase tracking-wide font-bold text-secondary-600">
                            {format(day, "EEE", { locale: ptBR })}
                          </p>
                          <p className={`text-lg font-bold ${isToday || isSelected ? "text-primary" : "text-secondary-900"
                            }`}>
                            {format(day, "dd")}
                          </p>
                        </div>
                      );
                    })}
                  </div>

                  <div className="grid grid-cols-[80px_repeat(7,minmax(0,1fr))]">
                    <div className="flex flex-col border-r-2 border-primary/20">
                      {hours.map((hour) => (
                        <div key={hour} className="h-20 border-b border-primary/10 px-3 py-2 bg-gradient-to-br from-primary/5 to-transparent">
                          <span className="text-xs font-bold text-secondary-600">
                            {String(hour).padStart(2, "0")}:00
                          </span>
                        </div>
                      ))}
                    </div>

                    {daysOfWeek.map((day) => {
                      const dayKey = format(day, "yyyy-MM-dd");
                      const dayAppointments = appointmentsByDay[dayKey] ?? [];
                      const isToday = isSameDay(day, new Date());
                      const isSelected = isSameDay(day, anchorDate);

                      return (
                        <div
                          key={day.toISOString()}
                          className={`relative border-r-2 border-primary/20 ${isToday || isSelected ? "bg-primary/5" : ""
                            }`}
                        >
                          {hours.map((hour) => (
                            <div
                              key={hour}
                              className="h-20 border-b border-primary/10"
                            />
                          ))}

                          <div className="absolute inset-0">
                            {/* Linha do horário atual */}
                            {isToday && (() => {
                              const now = new Date();
                              const currentMinutes = (now.getHours() - WORK_START_HOUR) * 60 + now.getMinutes();
                              const currentTop = (currentMinutes / ((WORK_END_HOUR - WORK_START_HOUR) * 60)) * 100;

                              if (currentTop >= 0 && currentTop <= 100) {
                                return (
                                  <div
                                    className="absolute left-0 right-0 z-20 pointer-events-none"
                                    style={{ top: `${currentTop}%` }}
                                  >
                                    <div className="h-0.5 bg-red-500 shadow-lg shadow-red-500/50" />
                                    <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-3 h-3 bg-red-500 rounded-full border-2 border-white shadow-md" />
                                  </div>
                                );
                              }
                              return null;
                            })()}

                            {dayAppointments.map((appointment) => {
                              const startDate = new Date(appointment.date);
                              const endDate = new Date(startDate);
                              endDate.setMinutes(
                                endDate.getMinutes() + appointment.service.durationMin
                              );

                              const startMinutes =
                                (startDate.getHours() - WORK_START_HOUR) * 60 + startDate.getMinutes();
                              const duration = appointment.service.durationMin;

                              const top = (startMinutes / ((WORK_END_HOUR - WORK_START_HOUR) * 60)) * 100;
                              const height =
                                (duration / ((WORK_END_HOUR - WORK_START_HOUR) * 60)) * 100;

                              return (
                                <div
                                  key={appointment.id}
                                  onClick={() => {
                                    setSelectedAppointment(appointment);
                                    setIsDetailsOpen(true);
                                  }}
                                  className="absolute left-2 right-2 rounded-xl border-2 border-primary/40 bg-gradient-to-br from-primary/20 to-primary/10 p-3 text-sm shadow-lg hover:shadow-xl transition-all cursor-pointer hover:scale-[1.02]"
                                  style={{
                                    top: `${top}%`,
                                    height: `${Math.max(height, 12)}%`
                                  }}
                                >
                                  <p className="font-bold text-secondary-900 truncate">
                                    {appointment.client.name}
                                  </p>
                                  <p className="text-xs text-secondary-600 font-medium">
                                    {format(startDate, "HH:mm")} - {format(endDate, "HH:mm")}
                                  </p>
                                  <Badge className="mt-2 inline-block bg-gradient-to-r from-primary to-accent text-white text-xs font-bold shadow-md">
                                    {appointment.service.name}
                                  </Badge>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modais */}
      <NewAppointmentModal
        isOpen={isNewAppointmentOpen}
        onClose={() => setIsNewAppointmentOpen(false)}
        initialDate={anchorDate}
        onSuccess={() => {
          loadAppointments();
        }}
      />

      <AppointmentDetailsModal
        isOpen={isDetailsOpen}
        onClose={() => {
          setIsDetailsOpen(false);
          setSelectedAppointment(null);
        }}
        appointment={selectedAppointment}
        onUpdate={() => {
          loadAppointments();
        }}
        onEdit={(appointment) => {
          setSelectedAppointment(appointment);
          setIsEditOpen(true);
        }}
      />

      <EditAppointmentModal
        isOpen={isEditOpen}
        onClose={() => {
          setIsEditOpen(false);
          setSelectedAppointment(null);
        }}
        appointment={selectedAppointment}
        onSuccess={() => {
          loadAppointments();
        }}
      />
    </div>
  );
}

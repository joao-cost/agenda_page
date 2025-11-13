import { useEffect, useMemo, useState } from "react";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  parseISO,
  startOfMonth,
  startOfWeek,
  subMonths
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { listAppointments, type Appointment } from "../../api/appointments";
import { Button } from "../../components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import { Link } from "react-router-dom";

const WORK_START_HOUR = 8;
const WORK_END_HOUR = 18;

function groupAppointmentsByDay(appointments: Appointment[]) {
  return appointments.reduce<Record<string, Appointment[]>>((acc, appointment) => {
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

  const visibleRange = useMemo(() => {
    const start = startOfWeek(anchorDate, { weekStartsOn: 1 });
    const end = endOfWeek(anchorDate, { weekStartsOn: 1 });
    return { start, end };
  }, [anchorDate]);

  useEffect(() => {
    async function loadAppointments() {
      setLoading(true);
      setError(null);
      try {
        const data = await listAppointments({
          start: visibleRange.start.toISOString(),
          end: visibleRange.end.toISOString()
        });
        setAppointments(
          data.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        );
      } catch (err) {
        console.error(err);
        setError("Não foi possível carregar os agendamentos.");
      } finally {
        setLoading(false);
      }
    }

    loadAppointments();
  }, [visibleRange.start, visibleRange.end]);

  const daysOfWeek = useMemo(
    () =>
      eachDayOfInterval({
        start: visibleRange.start,
        end: visibleRange.end
      }),
    [visibleRange]
  );

  const appointmentsByDay = useMemo(
    () => groupAppointmentsByDay(appointments),
    [appointments]
  );

  const hours = useMemo(() => {
    const list: number[] = [];
    for (let hour = WORK_START_HOUR; hour <= WORK_END_HOUR; hour++) {
      list.push(hour);
    }
    return list;
  }, []);

  const monthDays = useMemo(() => {
    const start = startOfWeek(startOfMonth(monthCursor), { weekStartsOn: 1 });
    const end = endOfWeek(endOfMonth(monthCursor), { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
  }, [monthCursor]);

  return (
    <div className="h-full flex flex-col gap-6 lg:flex-row overflow-hidden">
      <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-2 border-blue-300/30 shadow-xl lg:w-72 flex-shrink-0 h-full flex flex-col overflow-hidden">
        <CardHeader className="space-y-4 border-b border-primary/20 pb-4 flex-shrink-0">
          <CardTitle className="text-xl font-bold text-secondary-900">Agenda</CardTitle>
          <Button asChild className="w-full bg-gradient-to-r from-primary to-accent text-white shadow-lg">
            <Link to="/dashboard/novo-agendamento">Novo agendamento</Link>
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
                  className={`relative flex h-10 w-10 items-center justify-center rounded-lg border-2 transition-all ${
                    isSelected
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
            <CardTitle className="text-xl font-bold text-secondary-900">Semana da agenda</CardTitle>
            <p className="text-sm text-secondary-600 font-medium">
              {format(visibleRange.start, "dd MMM", { locale: ptBR })} –{" "}
              {format(visibleRange.end, "dd MMM yyyy", { locale: ptBR })}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
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
              <div className="grid grid-cols-[80px_repeat(7,minmax(0,1fr))] gap-0 border-b-2 border-primary/20 sticky top-0 bg-white z-10">
                <div className="bg-gradient-to-br from-primary/10 to-primary/5 border-r-2 border-primary/20"></div>
                {daysOfWeek.map((day) => {
                  const isToday = isSameDay(day, new Date());
                  const isSelected = isSameDay(day, anchorDate);
                  return (
                    <div
                      key={day.toISOString()}
                      className={`border-r-2 border-primary/20 px-3 py-3 text-center ${
                        isToday || isSelected
                          ? "bg-gradient-to-br from-primary/20 to-primary/10"
                          : "bg-gradient-to-br from-primary/10 to-primary/5"
                      }`}
                    >
                      <p className="text-xs uppercase tracking-wide font-bold text-secondary-600">
                        {format(day, "EEE", { locale: ptBR })}
                      </p>
                      <p className={`text-lg font-bold ${
                        isToday || isSelected ? "text-primary" : "text-secondary-900"
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
                      className={`relative border-r-2 border-primary/20 ${
                        isToday || isSelected ? "bg-primary/5" : ""
                      }`}
                    >
                      {hours.map((hour) => (
                        <div
                          key={hour}
                          className="h-20 border-b border-primary/10"
                        />
                      ))}

                      <div className="absolute inset-0">
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
                              className="absolute left-2 right-2 rounded-xl border-2 border-primary/40 bg-gradient-to-br from-primary/20 to-primary/10 p-3 text-sm shadow-lg hover:shadow-xl transition-all cursor-pointer"
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
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}



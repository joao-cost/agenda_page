import { useState, useMemo } from "react";
import {
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  startOfWeek,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  parseISO
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "./Button";

// Feriados nacionais do Brasil 2025
const BRAZILIAN_HOLIDAYS_2025 = [
  "2025-01-01", // Ano Novo
  "2025-02-17", // Carnaval
  "2025-02-18", // Carnaval
  "2025-04-18", // Sexta-feira Santa
  "2025-04-21", // Tiradentes
  "2025-05-01", // Dia do Trabalhador
  "2025-06-19", // Corpus Christi
  "2025-09-07", // Independência
  "2025-10-12", // Nossa Senhora Aparecida
  "2025-11-02", // Finados
  "2025-11-15", // Proclamação da República
  "2025-11-20", // Dia da Consciência Negra
  "2025-12-25"  // Natal
];

interface MiniCalendarProps {
  closedDates: string[]; // Array de datas no formato "yyyy-MM-dd"
  onDateToggle: (date: string) => void; // Função chamada ao clicar em uma data
  onSave?: () => void; // Função opcional para salvar após toggle
}

export function MiniCalendar({ closedDates, onDateToggle, onSave }: MiniCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const monthDays = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentMonth), { weekStartsOn: 0 }); // Domingo = 0
    const end = endOfWeek(endOfMonth(currentMonth), { weekStartsOn: 0 });
    return eachDayOfInterval({ start, end });
  }, [currentMonth]);

  const handleDateClick = (date: Date) => {
    const dateString = format(date, "yyyy-MM-dd");
    onDateToggle(dateString);
    // Não chamar onSave aqui, pois onDateToggle já salva automaticamente
  };

  const isHoliday = (date: Date) => {
    const dateString = format(date, "yyyy-MM-dd");
    return BRAZILIAN_HOLIDAYS_2025.includes(dateString);
  };

  const isClosed = (date: Date) => {
    const dateString = format(date, "yyyy-MM-dd");
    return closedDates.includes(dateString);
  };

  const isToday = (date: Date) => {
    return isSameDay(date, new Date());
  };

  return (
    <div className="rounded-2xl border-2 border-primary/20 bg-white p-4 shadow-lg">
      {/* Header do Calendário */}
      <div className="flex items-center justify-between mb-4">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
          className="h-8 w-8 p-0 border-primary/30 hover:bg-primary/10"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <h3 className="text-lg font-bold text-secondary-900">
          {format(currentMonth, "MMMM yyyy", { locale: ptBR })}
        </h3>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
          className="h-8 w-8 p-0 border-primary/30 hover:bg-primary/10"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Dias da Semana */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map((day) => (
          <div key={day} className="text-center text-xs font-bold text-secondary-500 py-1">
            {day}
          </div>
        ))}
      </div>

      {/* Dias do Mês */}
      <div className="grid grid-cols-7 gap-1">
        {monthDays.map((day) => {
          const isCurrentMonth = isSameMonth(day, currentMonth);
          const isHolidayDate = isHoliday(day);
          const isClosedDate = isClosed(day);
          const isTodayDate = isToday(day);

          return (
            <button
              key={day.toISOString()}
              type="button"
              onClick={() => handleDateClick(day)}
              className={`
                h-8 w-full rounded-lg text-xs font-semibold transition-all duration-200
                ${!isCurrentMonth ? "opacity-30" : ""}
                ${isClosedDate
                  ? "bg-red-500 text-white shadow-md hover:bg-red-600 scale-105"
                  : isHolidayDate
                  ? "bg-red-100 text-red-700 border-2 border-red-300 hover:bg-red-200"
                  : isTodayDate
                  ? "bg-primary/20 text-primary border-2 border-primary/50 font-bold"
                  : "bg-white text-secondary-700 border border-secondary-200 hover:bg-primary/10 hover:border-primary/40"
                }
              `}
              title={
                isHolidayDate
                  ? "Feriado Nacional"
                  : isClosedDate
                  ? "Data Fechada - Clique para abrir"
                  : "Clique para fechar esta data"
              }
            >
              {format(day, "d")}
            </button>
          );
        })}
      </div>

      {/* Legenda */}
      <div className="mt-4 pt-4 border-t border-primary/20 space-y-2">
        <div className="flex items-center gap-2 text-xs">
          <div className="h-4 w-4 rounded bg-red-500"></div>
          <span className="text-secondary-600">Data Fechada</span>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <div className="h-4 w-4 rounded bg-red-100 border-2 border-red-300"></div>
          <span className="text-secondary-600">Feriado Nacional</span>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <div className="h-4 w-4 rounded bg-primary/20 border-2 border-primary/50"></div>
          <span className="text-secondary-600">Hoje</span>
        </div>
        <p className="text-xs text-secondary-500 mt-2">
          Clique em uma data para abrir/fechar. Feriados nacionais são destacados automaticamente.
        </p>
      </div>
    </div>
  );
}


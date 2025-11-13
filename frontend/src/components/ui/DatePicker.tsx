import { useState } from "react";
import { DayPicker } from "react-day-picker";
import { format } from "date-fns";
import ptBR from "date-fns/locale/pt-BR";
import { cn } from "../../utils/cn";
import { Button } from "./Button";
import { Calendar } from "lucide-react";
import "react-day-picker/dist/style.css";

interface DatePickerProps {
  value: Date;
  onChange: (date: Date) => void;
  className?: string;
}

export function DatePicker({ value, onChange, className }: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className={cn("w-full", className)}>
      <Button
        type="button"
        variant="secondary"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full justify-start text-left font-normal border-primary/30 hover:bg-primary/10"
      >
        <Calendar className="mr-2 h-4 w-4" />
        {value ? format(value, "dd/MM/yyyy", { locale: ptBR }) : "Selecione uma data"}
      </Button>
      {isOpen && (
        <div className="w-full mt-3 rounded-xl border border-primary/20 bg-white p-6 shadow-lg">
          <DayPicker
            mode="single"
            selected={value}
            onSelect={(date) => {
              if (date) {
                onChange(date);
                setIsOpen(false);
              }
            }}
            locale={ptBR}
            className="rounded-lg w-full"
            classNames={{
              months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0 w-full",
              month: "space-y-4 w-full",
              caption: "flex justify-center pt-1 relative items-center mb-4",
              caption_label: "text-base font-bold text-secondary-900",
              nav: "space-x-1 flex items-center",
              nav_button: cn(
                "h-8 w-8 bg-primary/10 hover:bg-primary/20 p-0 rounded-lg transition-all hover:scale-110 text-primary font-bold"
              ),
              nav_button_previous: "absolute left-1",
              nav_button_next: "absolute right-1",
              table: "w-full border-collapse space-y-1",
              head_row: "flex mb-2",
              head_cell: "text-secondary-600 rounded-md w-10 font-semibold text-sm",
              row: "flex w-full mt-1",
              cell: "h-10 w-10 text-center text-sm p-0 relative rounded-lg transition-all",
              day: cn(
                "h-10 w-10 p-0 font-medium rounded-lg hover:bg-primary/20 hover:text-primary transition-all hover:scale-110"
              ),
              day_selected:
                "bg-gradient-to-r from-primary to-accent text-white hover:from-primary hover:to-accent hover:text-white shadow-lg shadow-primary/30 font-bold",
              day_today: "bg-primary/10 text-primary font-bold ring-2 ring-primary/30",
              day_outside:
                "opacity-40",
              day_disabled: "text-secondary-300 opacity-30",
              day_range_middle:
                "bg-primary/10 text-primary",
              day_hidden: "invisible",
            }}
          />
          <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-primary/20">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
              className="text-sm border-primary/30"
            >
              Fechar
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                onChange(new Date());
                setIsOpen(false);
              }}
              className="text-sm bg-gradient-to-r from-primary to-accent text-white border-0"
            >
              Hoje
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}


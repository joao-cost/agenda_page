import { useEffect, useState } from "react";
import { format } from "date-fns";
import { fetchDailyRevenue, fetchMonthlyRevenue, type RevenueSummary } from "../../api/reports";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/Card";
import { Input } from "../../components/ui/Input";
import { Label } from "../../components/ui/Label";

export function DashboardReports() {
  const [dailySummary, setDailySummary] = useState<RevenueSummary | null>(null);
  const [monthlySummary, setMonthlySummary] = useState<RevenueSummary | null>(null);
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [selectedMonth, setSelectedMonth] = useState(() => format(new Date(), "yyyy-MM"));

  useEffect(() => {
    async function loadDaily() {
      const data = await fetchDailyRevenue(selectedDate);
      setDailySummary(data);
    }
    async function loadMonthly() {
      const data = await fetchMonthlyRevenue(selectedMonth);
      setMonthlySummary(data);
    }

    loadDaily().catch(console.error);
    loadMonthly().catch(console.error);
  }, [selectedDate, selectedMonth]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-secondary-900">Relatórios financeiros</h1>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg text-secondary-900">Resumo diário</CardTitle>
            <div className="space-y-1 text-right">
              <Label htmlFor="date" className="text-xs text-secondary-500">
                Data
              </Label>
              <Input id="date" type="date" value={selectedDate} onChange={(event) => setSelectedDate(event.target.value)} />
            </div>
          </CardHeader>
          <CardContent>
            {dailySummary ? (
              <div className="space-y-3">
                <SummaryItem label="Total arrecadado" value={dailySummary.total} />
                <SummaryItem label="Agendamentos" value={dailySummary.appointments} isNumber />
                <SummaryItem label="Pagamentos confirmados" value={dailySummary.paid} />
                <SummaryItem label="Pendências" value={dailySummary.pending} />
              </div>
            ) : (
              <p className="text-sm text-secondary-500">Nenhum dado disponível.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg text-secondary-900">Resumo mensal</CardTitle>
            <div className="space-y-1 text-right">
              <Label htmlFor="month" className="text-xs text-secondary-500">
                Mês
              </Label>
              <Input
                id="month"
                type="month"
                value={selectedMonth}
                onChange={(event) => setSelectedMonth(event.target.value)}
              />
            </div>
          </CardHeader>
          <CardContent>
            {monthlySummary ? (
              <div className="space-y-3">
                <SummaryItem label="Total arrecadado" value={monthlySummary.total} />
                <SummaryItem label="Agendamentos" value={monthlySummary.appointments} isNumber />
                <SummaryItem label="Pagamentos confirmados" value={monthlySummary.paid} />
                <SummaryItem label="Pendências" value={monthlySummary.pending} />
              </div>
            ) : (
              <p className="text-sm text-secondary-500">Nenhum dado disponível.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function SummaryItem({ label, value, isNumber = false }: { label: string; value: number; isNumber?: boolean }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-secondary-100 bg-primary/5 px-4 py-3">
      <span className="text-sm text-secondary-600">{label}</span>
      <span className="text-sm font-semibold text-secondary-900">
        {isNumber
          ? value
          : value.toLocaleString("pt-BR", {
              style: "currency",
              currency: "BRL"
            })}
      </span>
    </div>
  );
}



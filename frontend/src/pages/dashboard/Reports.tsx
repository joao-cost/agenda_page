import { useEffect, useState } from "react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { fetchDailyRevenue, fetchMonthlyRevenue, fetchPendingPayments, type RevenueSummary, type PendingPaymentsResponse } from "../../api/reports";
import { updatePaymentStatus } from "../../api/payments";
import { ConfirmDialog } from "../../components/ui/ConfirmDialog";
import { AlertDialog } from "../../components/ui/AlertDialog";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/Card";
import { Input } from "../../components/ui/Input";
import { Label } from "../../components/ui/Label";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { DollarSign } from "lucide-react";

export function DashboardReports() {
  const [dailySummary, setDailySummary] = useState<RevenueSummary | null>(null);
  const [monthlySummary, setMonthlySummary] = useState<RevenueSummary | null>(null);
  const [pendingPayments, setPendingPayments] = useState<PendingPaymentsResponse | null>(null);
  const [loadingPending, setLoadingPending] = useState(false);
  const [selectedDate, setSelectedDate] = useState(() => format(new Date(), "yyyy-MM-dd"));
  const [selectedMonth, setSelectedMonth] = useState(() => format(new Date(), "yyyy-MM"));
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    type?: "warning" | "danger" | "info" | "success";
  }>({ isOpen: false, title: "", message: "", onConfirm: () => {} });
  const [alertDialog, setAlertDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type?: "error" | "success" | "info" | "warning";
  }>({ isOpen: false, title: "", message: "" });

  useEffect(() => {
    async function loadDaily() {
      const data = await fetchDailyRevenue(selectedDate);
      setDailySummary(data);
    }
    async function loadMonthly() {
      const data = await fetchMonthlyRevenue(selectedMonth);
      setMonthlySummary(data);
    }

    async function loadPending() {
      setLoadingPending(true);
      try {
        const data = await fetchPendingPayments();
        setPendingPayments(data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoadingPending(false);
      }
    }

    loadDaily().catch(console.error);
    loadMonthly().catch(console.error);
    loadPending();
  }, [selectedDate, selectedMonth]);

  return (
    <div className="h-full flex flex-col gap-6 overflow-hidden">
      <div className="flex-shrink-0">
        <h1 className="text-2xl font-bold text-secondary-900">Relatórios financeiros</h1>
        <p className="text-sm text-secondary-600">Acompanhe a performance financeira do negócio</p>
      </div>
      <div className="flex-1 overflow-auto min-h-0">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 h-full">
          <Card className="bg-gradient-to-br from-white via-white to-primary/5 border-2 border-primary/20 shadow-xl flex flex-col overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between border-b border-primary/20 pb-4 flex-shrink-0">
              <CardTitle className="text-xl font-bold text-secondary-900">Resumo diário</CardTitle>
            <div className="space-y-1 text-right">
              <Label htmlFor="date" className="text-xs text-secondary-500">
                Data
              </Label>
              <Input id="date" type="date" value={selectedDate} onChange={(event) => setSelectedDate(event.target.value)} />
            </div>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto">
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

          <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-2 border-blue-300/30 shadow-xl flex flex-col overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between border-b border-primary/20 pb-4 flex-shrink-0">
              <CardTitle className="text-xl font-bold text-secondary-900">Resumo mensal</CardTitle>
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
          <CardContent className="flex-1 overflow-y-auto">
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

        {/* Pendências */}
        <Card className="bg-gradient-to-br from-yellow-500/10 to-yellow-600/5 border-2 border-yellow-300/30 shadow-xl flex flex-col overflow-hidden">
          <CardHeader className="border-b border-primary/20 pb-4 flex-shrink-0">
            <CardTitle className="text-xl font-bold text-secondary-900">Pendências</CardTitle>
            <p className="text-xs text-secondary-600 mt-1">Agendamentos entregues aguardando pagamento</p>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto">
            {loadingPending ? (
              <p className="text-sm text-secondary-500">Carregando pendências...</p>
            ) : pendingPayments && pendingPayments.appointments.length > 0 ? (
              <div className="space-y-3">
                <div className="rounded-xl border-2 border-yellow-300/30 bg-yellow-50/50 px-4 py-3 mb-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-secondary-700">Total Pendente:</span>
                    <span className="text-lg font-bold text-yellow-700">
                      {pendingPayments.total.toLocaleString("pt-BR", {
                        style: "currency",
                        currency: "BRL"
                      })}
                    </span>
                  </div>
                  <p className="text-xs text-secondary-600 mt-1">
                    {pendingPayments.count} agendamento{pendingPayments.count !== 1 ? "s" : ""} pendente{pendingPayments.count !== 1 ? "s" : ""}
                  </p>
                </div>
                <div className="space-y-2 max-h-[400px] overflow-y-auto">
                  {pendingPayments.appointments.map((apt) => (
                    <div
                      key={apt.id}
                      className="rounded-xl border-2 border-primary/20 bg-white/50 p-3"
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-secondary-900 text-sm truncate">{apt.clientName}</p>
                          <p className="text-xs text-secondary-600">{apt.serviceName}</p>
                          <p className="text-xs text-secondary-500 mt-1">
                            {format(parseISO(apt.date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                          </p>
                        </div>
                        <Badge className="bg-yellow-500 text-white text-xs font-bold flex-shrink-0">
                          {apt.amount.toLocaleString("pt-BR", {
                            style: "currency",
                            currency: "BRL"
                          })}
                        </Badge>
                      </div>
                      <Button
                        type="button"
                        onClick={() => {
                          setConfirmDialog({
                            isOpen: true,
                            title: "Marcar como Pago",
                            message: `Deseja marcar o pagamento de ${apt.clientName} como pago?`,
                            type: "success",
                            onConfirm: async () => {
                              try {
                                await updatePaymentStatus(apt.paymentId, "PAGO");
                                // Recarregar pendências
                                const data = await fetchPendingPayments();
                                setPendingPayments(data);
                                // Recarregar resumos também
                                const [daily, monthly] = await Promise.all([
                                  fetchDailyRevenue(selectedDate),
                                  fetchMonthlyRevenue(selectedMonth)
                                ]);
                                setDailySummary(daily);
                                setMonthlySummary(monthly);
                                setConfirmDialog({ ...confirmDialog, isOpen: false });
                              } catch (error: any) {
                                console.error(error);
                                setConfirmDialog({ ...confirmDialog, isOpen: false });
                                setAlertDialog({
                                  isOpen: true,
                                  title: "Erro",
                                  message: error.response?.data?.message || "Erro ao marcar como pago.",
                                  type: "error"
                                });
                              }
                            }
                          });
                        }}
                        className="w-full h-8 text-xs bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700"
                      >
                        <DollarSign className="h-3 w-3 mr-1" />
                        Marcar como Pago
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full py-8">
                <p className="text-sm text-secondary-500">Nenhuma pendência encontrada.</p>
                <p className="text-xs text-secondary-400 mt-1">Todos os pagamentos estão em dia! 🎉</p>
              </div>
            )}
          </CardContent>
        </Card>
        </div>
      </div>

      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}
        onConfirm={confirmDialog.onConfirm}
        title={confirmDialog.title}
        message={confirmDialog.message}
        type={confirmDialog.type}
      />

      <AlertDialog
        isOpen={alertDialog.isOpen}
        onClose={() => setAlertDialog({ ...alertDialog, isOpen: false })}
        title={alertDialog.title}
        message={alertDialog.message}
        type={alertDialog.type}
      />
    </div>
  );
}

function SummaryItem({ label, value, isNumber = false }: { label: string; value: number; isNumber?: boolean }) {
  return (
    <div className="flex items-center justify-between rounded-xl border-2 border-primary/20 bg-white/50 px-4 py-3 shadow-md hover:shadow-lg transition-all">
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



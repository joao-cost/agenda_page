import { useEffect, useState } from "react";
import { format, startOfDay, addDays, startOfWeek, endOfWeek } from "date-fns";
import ptBR from "date-fns/locale/pt-BR";
import { listAppointments } from "../../api/appointments";
import { Card } from "../../components/ui/Card";
import { Calendar, Users, Clock, DollarSign } from "lucide-react";

interface Stats {
  today: number;
  tomorrow: number;
  weekClients: number;
  pendingPayments: number;
}

export function DashboardStats() {
  const [stats, setStats] = useState<Stats>({
    today: 0,
    tomorrow: 0,
    weekClients: 0,
    pendingPayments: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      setLoading(true);
      try {
        const today = startOfDay(new Date());
        const tomorrow = startOfDay(addDays(today, 1));
        const weekStart = startOfWeek(today, { weekStartsOn: 1 });
        const weekEnd = endOfWeek(today, { weekStartsOn: 1 });

        // Buscar agendamentos de hoje
        const todayAppointments = await listAppointments({
          date: format(today, "yyyy-MM-dd")
        });

        // Buscar agendamentos de amanhã
        const tomorrowAppointments = await listAppointments({
          date: format(tomorrow, "yyyy-MM-dd")
        });

        // Buscar agendamentos da semana
        const weekAppointments = await listAppointments({
          start: weekStart.toISOString(),
          end: weekEnd.toISOString()
        });

        // Contar clientes únicos atendidos na semana (status ENTREGUE)
        const deliveredThisWeek = weekAppointments.filter(
          (apt) => apt.status === "ENTREGUE"
        );
        const uniqueClients = new Set(
          deliveredThisWeek.map((apt) => apt.client.id)
        );

        // Contar lavagens pendentes de pagamento
        const allAppointments = await listAppointments({});
        const pendingPayments = allAppointments.filter(
          (apt) => apt.payment?.status === "PENDENTE"
        ).length;

        setStats({
          today: todayAppointments.length,
          tomorrow: tomorrowAppointments.length,
          weekClients: uniqueClients.size,
          pendingPayments
        });
      } catch (error) {
        console.error("Erro ao carregar estatísticas:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, []);

  const statCards = [
    {
      title: "Agendamentos Hoje",
      value: stats.today,
      icon: Calendar,
      color: "from-blue-500 to-blue-600",
      bgColor: "bg-blue-50",
      textColor: "text-blue-700"
    },
    {
      title: "Agendamentos para Amanhã",
      value: stats.tomorrow,
      icon: Clock,
      color: "from-purple-500 to-purple-600",
      bgColor: "bg-purple-50",
      textColor: "text-purple-700"
    },
    {
      title: "Clientes Atendidos na Semana",
      value: stats.weekClients,
      icon: Users,
      color: "from-green-500 to-green-600",
      bgColor: "bg-green-50",
      textColor: "text-green-700"
    },
    {
      title: "Lavagens Pendentes para Pagamento",
      value: stats.pendingPayments,
      icon: DollarSign,
      color: "from-yellow-500 to-yellow-600",
      bgColor: "bg-yellow-50",
      textColor: "text-yellow-700"
    }
  ];

  if (loading) {
    return (
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4 mb-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="p-4 animate-pulse">
            <div className="h-16 bg-secondary-200 rounded" />
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4 mb-4">
      {statCards.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <Card
            key={index}
            className="p-4 hover:shadow-lg transition-all border border-primary/20 hover:border-primary/40 hover:-translate-y-0.5"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-secondary-600 mb-1 truncate">
                  {stat.title}
                </p>
                <p className="text-2xl font-bold text-secondary-900">
                  {stat.value}
                </p>
              </div>
              <div
                className={`p-2 rounded-lg bg-gradient-to-br ${stat.color} shadow-md flex-shrink-0`}
              >
                <Icon className="h-5 w-5 text-white" />
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}


import { useEffect } from "react";
import { Navigate, Outlet, RouteObject, useLocation, useRoutes } from "react-router-dom";
import { LandingPage } from "../pages/Landing";
import { SchedulePage } from "../pages/Schedule";
import { DashboardLayout } from "../pages/dashboard/Layout";
import { DashboardKanban } from "../pages/dashboard/Kanban";
import { DashboardClients } from "../pages/dashboard/Clients";
import { DashboardReports } from "../pages/dashboard/Reports";
import { DashboardNewAppointment } from "../pages/dashboard/NewAppointment";
import { DashboardCalendar } from "../pages/dashboard/Calendar";
import { DashboardSettings } from "../pages/dashboard/Settings";
import { ClientHistory } from "../pages/dashboard/ClientHistory";
import { AuthPage } from "../pages/Auth";
import { useAuthStore } from "../store/auth";

const routes: RouteObject[] = [
  {
    path: "/",
    element: <LandingPage />
  },
  {
    path: "/login",
    element: <AuthPage />
  },
  {
    path: "/agendar",
    element: (
      <RequireAuth>
        <SchedulePage />
      </RequireAuth>
    )
  },
  {
    path: "/meu-historico",
    element: (
      <RequireAuth>
        <ClientHistory />
      </RequireAuth>
    )
  },
  {
    path: "/dashboard",
    element: (
      <RequireAuth requireAdmin>
        <DashboardLayout />
      </RequireAuth>
    ),
    children: [
      { index: true, element: <DashboardKanban /> },
      { path: "agenda", element: <DashboardCalendar /> },
      { path: "novo-agendamento", element: <DashboardNewAppointment /> },
      { path: "clientes", element: <DashboardClients /> },
      { path: "relatorios", element: <DashboardReports /> },
      { path: "configuracoes", element: <DashboardSettings /> }
    ]
  },
  {
    path: "*",
    element: <Navigate to="/" />
  }
];

function RequireAuth({
  children,
  requireAdmin = false
}: {
  children: React.ReactNode;
  requireAdmin?: boolean;
}) {
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const checkSession = useAuthStore((state) => state.checkSession);
  const initialized = useAuthStore((state) => state.initialized);
  const loading = useAuthStore((state) => state.loading);
  const location = useLocation();

  useEffect(() => {
    checkSession();
  }, [checkSession]);

  if (!initialized || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <span className="text-sm text-slate-500">Carregando sessão...</span>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requireAdmin && user?.role !== "ADMIN") {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

export function Router() {
  const element = useRoutes(routes);
  return element;
}


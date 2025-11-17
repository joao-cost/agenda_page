import { useState } from "react";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/auth";
import { Button } from "../../components/ui/Button";
import { 
  LayoutDashboard, 
  Calendar, 
  PlusCircle, 
  Users, 
  BarChart3, 
  Settings,
  Menu,
  X,
  LogOut
} from "lucide-react";
import { cn } from "../../utils/cn";

const navItems = [
  { to: "/dashboard", label: "Kanban", icon: LayoutDashboard },
  { to: "/dashboard/agenda", label: "Agenda", icon: Calendar },
  { to: "/dashboard/novo-agendamento", label: "Novo agendamento", icon: PlusCircle },
  { to: "/dashboard/clientes", label: "Clientes", icon: Users },
  { to: "/dashboard/relatorios", label: "Relatórios", icon: BarChart3 },
  { to: "/dashboard/configuracoes", label: "Configurações", icon: Settings }
];

export function DashboardLayout() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [isExpanded, setIsExpanded] = useState(true);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <div className="flex h-full bg-gradient-to-br from-secondary-900 via-secondary-800 to-secondary-900 overflow-hidden">
      {/* Sidebar Escuro - Recolhível */}
      <aside className={cn(
        "hidden lg:flex flex-shrink-0 flex-col justify-between border-r border-primary/30 bg-gradient-to-b from-secondary-900 via-secondary-800 to-secondary-900 py-6 shadow-2xl shadow-black/50 transition-all duration-300",
        isExpanded ? "w-72 px-4" : "w-20 px-3"
      )}>
        <div className="flex flex-col gap-6">
          {/* Botão Hamburger */}
          <div className="flex items-center justify-between px-2">
            {isExpanded && (
              <Link to="/" className="flex items-center gap-3">
                <img src="https://placehold.co/120x40.png" alt="DetailPrime" className="h-8 w-auto brightness-0 invert" />
              </Link>
            )}
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-2 rounded-lg hover:bg-primary/20 text-surface/70 hover:text-surface transition-colors"
              aria-label={isExpanded ? "Recolher menu" : "Expandir menu"}
            >
              {isExpanded ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>

          <nav className="flex flex-col gap-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === "/dashboard"}
                  className={({ isActive }) =>
                    cn(
                      "group relative rounded-xl transition-all duration-200 flex items-center gap-3",
                      isExpanded ? "px-4 py-3" : "px-3 py-3 justify-center",
                      isActive
                        ? "bg-gradient-to-r from-primary to-accent text-white shadow-lg shadow-primary/50"
                        : "text-surface/70 hover:bg-primary/20 hover:text-surface"
                    )
                  }
                  title={!isExpanded ? item.label : ""}
                >
                  {({ isActive }) => (
                    <>
                      <Icon className={cn("flex-shrink-0", isExpanded ? "h-5 w-5" : "h-6 w-6")} />
                      {isExpanded && (
                        <>
                          <span className="text-sm font-medium">{item.label}</span>
                          {isActive && (
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 h-2 w-2 rounded-full bg-white/80 animate-pulse" />
                          )}
                        </>
                      )}
                    </>
                  )}
                </NavLink>
              );
            })}
          </nav>
        </div>

        <div className={cn("space-y-3 border-t border-primary/30 pt-6", !isExpanded && "px-0")}>
          {isExpanded ? (
            <>
              <div className="rounded-xl bg-primary/10 p-3 border border-primary/20">
                <p className="text-xs uppercase tracking-wide text-surface/50 mb-1">Conectado como</p>
                <p className="text-sm font-semibold text-surface">{user?.name ?? "Administrador"}</p>
              </div>
              <Button
                variant="outline"
                className="w-full border-primary/30 text-surface hover:bg-red-500/20 hover:border-red-500/50 hover:text-red-200"
                onClick={handleLogout}
              >
                Sair
              </Button>
            </>
          ) : (
            <div className="flex flex-col gap-2">
              <button
                onClick={handleLogout}
                className="p-3 rounded-xl border border-primary/30 text-surface hover:bg-red-500/20 hover:border-red-500/50 hover:text-red-200 transition-colors flex items-center justify-center"
                title="Sair"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Conteúdo Principal - Scroll apenas aqui */}
      <div className="flex flex-1 flex-col bg-white overflow-hidden min-w-0">
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-4">
          <Outlet />
        </main>
      </div>
    </div>
  );
}



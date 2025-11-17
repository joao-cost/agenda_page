import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/auth";
import { Button } from "../ui/Button";
import { Avatar } from "../ui/Avatar";
import { cn } from "../../utils/cn";

export function AppHeader() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated, checkSession, initialized, logout, loading } = useAuthStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (!initialized && !loading) {
      checkSession().catch((error) => console.error("Erro ao validar sessão:", error));
    }
  }, [initialized, loading, checkSession]);

  useEffect(() => {
    // Fechar menu mobile ao mudar de rota
    setMobileMenuOpen(false);
  }, [location.pathname]);

  // Fechar menu ao fazer scroll
  useEffect(() => {
    if (mobileMenuOpen) {
      const handleScroll = () => setMobileMenuOpen(false);
      window.addEventListener("scroll", handleScroll);
      return () => window.removeEventListener("scroll", handleScroll);
    }
  }, [mobileMenuOpen]);

  const isAdmin = user?.role === "ADMIN";

  const handleLinkClick = () => {
    setMobileMenuOpen(false);
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 w-full border-b border-primary/30 bg-gradient-to-r from-secondary-900 via-secondary-800 to-secondary-900 backdrop-blur-lg shadow-lg shadow-black/30">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link
          to="/"
          className="flex items-center gap-3"
          onClick={handleLinkClick}
        >
          <img src="https://placehold.co/120x40.png" alt="DetailPrime" className="h-10 w-auto brightness-0 invert" />
          <span className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent hidden sm:inline">
            DetailPrime
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden items-center gap-8 text-sm font-medium md:flex">
          <Link
            to="/"
            className={cn(
              "relative transition-colors hover:text-primary",
              location.pathname === "/"
                ? "text-primary font-semibold"
                : "text-surface/80"
            )}
          >
            Início
            {location.pathname === "/" && (
              <span className="absolute -bottom-1 left-0 right-0 h-0.5 bg-gradient-to-r from-primary to-accent" />
            )}
          </Link>
          <Link
            to="/agendar"
              className={cn(
                "relative transition-colors hover:text-primary",
                location.pathname.startsWith("/agendar")
                  ? "text-primary font-semibold"
                  : "text-surface/80"
              )}
          >
            Agendar
            {location.pathname.startsWith("/agendar") && (
              <span className="absolute -bottom-1 left-0 right-0 h-0.5 bg-gradient-to-r from-primary to-accent" />
            )}
          </Link>
        </nav>

        {/* Desktop Actions */}
        <div className="hidden items-center gap-3 md:flex">
          {!isAuthenticated ? (
            <>
              <Button
                variant="secondary"
                onClick={() => navigate("/login")}
                className="border-primary/30 bg-primary/10 text-surface hover:bg-primary/20"
              >
                Entrar
              </Button>
              <Button onClick={() => navigate("/login", { state: { tab: "register" } })}>
                Criar conta
              </Button>
            </>
          ) : (
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm font-semibold text-surface">
                  {user?.name ?? user?.email}
                </p>
                <p className="text-xs text-surface/70">
                  {isAdmin ? "Administrador" : "Cliente"}
                </p>
              </div>
              <Avatar initials={user?.name ?? user?.email} />
              <Button
                variant="secondary"
                onClick={() => navigate(isAdmin ? "/dashboard" : "/meu-historico")}
                className="border-primary/30 bg-primary/10 text-surface hover:bg-primary/20"
              >
                {isAdmin ? "Acessar painel" : "Meu histórico"}
              </Button>
              <Button
                variant="outline"
                onClick={() => logout()}
                className="border-primary/30 text-surface hover:bg-red-500/20 hover:border-red-500/50 hover:text-red-200"
              >
                Sair
              </Button>
            </div>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="flex flex-col items-center justify-center gap-1.5 rounded-lg p-2 text-surface/80 transition-colors hover:bg-primary/20 md:hidden"
          aria-label="Toggle menu"
          aria-expanded={mobileMenuOpen}
        >
          <span
            className={cn(
              "h-0.5 w-6 bg-current transition-all duration-300",
              mobileMenuOpen && "translate-y-2 rotate-45"
            )}
          />
          <span
            className={cn(
              "h-0.5 w-6 bg-current transition-all duration-300",
              mobileMenuOpen && "opacity-0"
            )}
          />
          <span
            className={cn(
              "h-0.5 w-6 bg-current transition-all duration-300",
              mobileMenuOpen && "-translate-y-2 -rotate-45"
            )}
          />
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm md:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />
          {/* Menu Panel */}
          <div className="fixed inset-y-0 right-0 z-50 w-80 max-w-[85vw] overflow-y-auto bg-gradient-to-br from-secondary-900 via-secondary-800 to-secondary-900 shadow-2xl shadow-black/50 md:hidden">
            <div className="flex flex-col gap-6 p-6">
              {/* Logo no Mobile */}
              <Link
                to="/"
                className="flex items-center gap-3 pb-4 border-b border-primary/30"
                onClick={handleLinkClick}
              >
                <img src="https://placehold.co/120x40.png" alt="DetailPrime" className="h-10 w-auto brightness-0 invert" />
                <span className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  DetailPrime
                </span>
              </Link>
              {/* User Info (if authenticated) */}
              {isAuthenticated && (
                <div className="flex items-center gap-4 rounded-2xl border border-primary/30 bg-primary/10 p-4">
                  <Avatar initials={user?.name ?? user?.email} />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-surface">
                      {user?.name ?? user?.email}
                    </p>
                    <p className="text-xs text-surface/70">
                      {isAdmin ? "Administrador" : "Cliente"}
                    </p>
                  </div>
                </div>
              )}

              {/* Mobile Navigation */}
              <nav className="flex flex-col gap-2">
                <Link
                  to="/"
                  onClick={handleLinkClick}
                  className={cn(
                    "rounded-xl px-4 py-3 text-base font-medium transition-all",
                    location.pathname === "/"
                      ? "bg-gradient-to-r from-primary to-accent text-white shadow-lg shadow-primary/30"
                      : "text-surface/80 hover:bg-primary/20"
                  )}
                >
                  Início
                </Link>
                <Link
                  to="/agendar"
                  onClick={handleLinkClick}
                  className={cn(
                    "rounded-xl px-4 py-3 text-base font-medium transition-all",
                    location.pathname.startsWith("/agendar")
                      ? "bg-gradient-to-r from-primary to-accent text-white shadow-lg shadow-primary/30"
                      : "text-surface/80 hover:bg-primary/20"
                  )}
                >
                  Agendar
                </Link>
              </nav>

              {/* Mobile Actions */}
              <div className="flex flex-col gap-3 border-t border-primary/10 pt-6">
                {isAuthenticated && !isAdmin && (
                  <Link
                    to="/meu-historico"
                    onClick={handleLinkClick}
                    className={cn(
                      "rounded-xl px-4 py-3 text-base font-medium transition-all text-center",
                      location.pathname.startsWith("/meu-historico")
                        ? "bg-gradient-to-r from-primary to-accent text-white shadow-lg shadow-primary/30"
                        : "text-surface/80 hover:bg-primary/20"
                    )}
                  >
                    Meu histórico
                  </Link>
                )}
                {!isAuthenticated ? (
                  <>
                    <Button
                      variant="secondary"
                      onClick={() => {
                        navigate("/login");
                        handleLinkClick();
                      }}
                      className="w-full border-primary/30 bg-primary/10 text-surface hover:bg-primary/20"
                    >
                      Entrar
                    </Button>
                    <Button
                      onClick={() => {
                        navigate("/login", { state: { tab: "register" } });
                        handleLinkClick();
                      }}
                      className="w-full"
                    >
                      Criar conta
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      variant="secondary"
                      onClick={() => {
                        navigate(isAdmin ? "/dashboard" : "/meu-historico");
                        handleLinkClick();
                      }}
                      className="w-full border-primary/30 bg-primary/10 text-surface hover:bg-primary/20"
                    >
                      {isAdmin ? "Acessar painel" : "Meu histórico"}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        logout();
                        handleLinkClick();
                      }}
                      className="w-full border-primary/30 text-surface hover:bg-red-500/20 hover:border-red-500/50 hover:text-red-200"
                    >
                      Sair
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </header>
  );
}


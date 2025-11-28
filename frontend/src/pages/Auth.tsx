import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Label } from "../components/ui/Label";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/Card";
import { useAuthStore } from "../store/auth";
import { LogIn, UserPlus, Mail, Lock, Phone, Car, Sparkles, CheckCircle, AlertCircle, Shield, Calendar } from "lucide-react";

type AuthMode = "login" | "register";

interface LoginForm {
  login: string;
  password: string;
}

interface RegisterForm {
  name: string;
  phone: string;
  vehicle: string;
  plate?: string;
  email: string;
  password: string;
}

export function AuthPage() {
  const [mode, setMode] = useState<AuthMode>("login");
  const navigate = useNavigate();
  const location = useLocation();
  const { login, register: registerUser, loading, error } = useAuthStore();

  // Verificar se veio da URL com tab=register
  useEffect(() => {
    const state = location.state as { tab?: string } | null;
    if (state?.tab === "register") {
      setMode("register");
    }
  }, [location.state]);

  const {
    register,
    handleSubmit,
    formState: { isSubmitting }
  } = useForm<LoginForm>();

  const {
    register: registerRegisterForm,
    handleSubmit: handleRegisterSubmit,
    formState: { errors: registerErrors, isSubmitting: isRegisterSubmitting }
  } = useForm<RegisterForm>({ mode: "onChange" });

  const from = (location.state as { from?: Location })?.from?.pathname || "/";

  const onSubmitLogin = async (data: LoginForm) => {
    try {
      await login(data);
      navigate(from, { replace: true });
    } catch (error) {
      console.error(error);
    }
  };

  const onSubmitRegister = async (data: RegisterForm) => {
    try {
      await registerUser(data);
      navigate("/agendar");
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-white to-accent/10 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-5xl">
        {/* Header com gradiente */}
        <header className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-primary to-accent p-6 md:p-8 text-white shadow-2xl mb-6">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48Y2lyY2xlIGN4PSIzMCIgY3k9IjMwIiByPSIyMCIvPjwvZz48L2c+PC9zdmc+')] opacity-20"></div>
          <div className="relative z-10 text-center space-y-3">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Sparkles className="h-6 w-6 text-yellow-300" />
              <span className="text-sm font-bold uppercase tracking-wider text-yellow-300">
                DetailPrime
              </span>
            </div>
            <h1 className="text-3xl font-bold md:text-4xl lg:text-5xl">
              {mode === "login" ? "Bem-vindo de volta!" : "Crie sua conta"}
            </h1>
            <p className="text-sm text-primary-foreground/90 md:text-base max-w-2xl mx-auto">
              {mode === "login"
                ? "Acesse sua conta para gerenciar agendamentos e acompanhar o status dos seus serviços."
                : "Cadastre-se para agendar serviços de lavagem e acompanhar seus veículos."}
            </p>
          </div>
        </header>

        <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
          {/* Card de Autenticação */}
          <Card className="bg-gradient-to-br from-white via-white to-primary/5 border-2 border-primary/20 shadow-xl">
            <CardHeader className="space-y-2 border-b-2 border-primary/20 pb-4">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-gradient-to-br from-primary to-accent p-2.5 shadow-lg">
                  {mode === "login" ? (
                    <LogIn className="h-5 w-5 text-white" />
                  ) : (
                    <UserPlus className="h-5 w-5 text-white" />
                  )}
                </div>
                <div>
                  <CardTitle className="text-2xl font-bold text-secondary-900">
                    {mode === "login" ? "Entrar" : "Cadastrar"}
                  </CardTitle>
                  <p className="text-sm text-secondary-600 mt-1">
                    {mode === "login" ? "Acesse sua conta" : "Crie sua conta gratuitamente"}
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              {/* Tabs de Login/Registro */}
              <div className="mb-6 grid grid-cols-2 gap-3">
                <Button
                  type="button"
                  variant={mode === "login" ? "primary" : "secondary"}
                  onClick={() => setMode("login")}
                  className={`h-12 font-semibold transition-all ${
                    mode === "login"
                      ? "bg-gradient-to-r from-primary to-accent text-white shadow-lg"
                      : "border-2 border-primary/30 bg-primary/10 text-primary hover:bg-primary/20"
                  }`}
                >
                  <LogIn className="h-4 w-4 mr-2" />
                  Entrar
                </Button>
                <Button
                  type="button"
                  variant={mode === "register" ? "primary" : "secondary"}
                  onClick={() => setMode("register")}
                  className={`h-12 font-semibold transition-all ${
                    mode === "register"
                      ? "bg-gradient-to-r from-primary to-accent text-white shadow-lg"
                      : "border-2 border-primary/30 bg-primary/10 text-primary hover:bg-primary/20"
                  }`}
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  Criar conta
                </Button>
              </div>

              {mode === "login" ? (
                <form onSubmit={handleSubmit(onSubmitLogin)} className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="login" className="text-sm font-semibold text-secondary-900 flex items-center gap-2">
                      <Mail className="h-3 w-3 text-primary" />
                      E-mail ou login
                    </Label>
                    <Input
                      id="login"
                      type="email"
                      placeholder="seuemail@exemplo.com"
                      {...register("login", { required: true })}
                      className="h-12 border-2 border-primary/30 focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-xl"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-sm font-semibold text-secondary-900 flex items-center gap-2">
                      <Lock className="h-3 w-3 text-primary" />
                      Senha
                    </Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="********"
                      {...register("password", { required: true })}
                      className="h-12 border-2 border-primary/30 focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-xl"
                    />
                  </div>
                  <Button
                    type="submit"
                    className="w-full h-12 bg-gradient-to-r from-primary to-accent text-white shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-[1.02]"
                    disabled={loading || isSubmitting}
                  >
                    {loading || isSubmitting ? (
                      <span className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        Entrando...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <LogIn className="h-5 w-5" />
                        Entrar
                      </span>
                    )}
                  </Button>
                </form>
              ) : (
                <form onSubmit={handleRegisterSubmit(onSubmitRegister)} className="space-y-5">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-sm font-semibold text-secondary-900 flex items-center gap-2">
                        <UserPlus className="h-3 w-3 text-primary" />
                        Nome completo
                      </Label>
                      <Input
                        id="name"
                        placeholder="Seu nome"
                        {...registerRegisterForm("name", {
                          required: "O nome é obrigatório",
                          minLength: {
                            value: 3,
                            message: "O nome deve ter pelo menos 3 caracteres"
                          },
                          maxLength: {
                            value: 100,
                            message: "O nome deve ter no máximo 100 caracteres"
                          },
                          pattern: {
                            value: /^[a-zA-ZÀ-ÿ\s]+$/,
                            message: "O nome pode conter apenas letras e espaços"
                          }
                        })}
                        className={`h-12 border-2 rounded-xl ${
                          registerErrors.name
                            ? "border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
                            : "border-primary/30 focus:border-primary focus:ring-2 focus:ring-primary/20"
                        }`}
                      />
                      {registerErrors.name && (
                        <div className="flex items-center gap-2 text-sm text-red-600 mt-1">
                          <AlertCircle className="h-4 w-4" />
                          <span>{registerErrors.name.message}</span>
                        </div>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone" className="text-sm font-semibold text-secondary-900 flex items-center gap-2">
                        <Phone className="h-3 w-3 text-primary" />
                        Telefone / WhatsApp
                      </Label>
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="(11) 99999-9999"
                        {...registerRegisterForm("phone", {
                          required: "O telefone é obrigatório",
                          pattern: {
                            value: /^[\d\s\(\)\-]+$/,
                            message: "Formato de telefone inválido"
                          },
                          minLength: {
                            value: 10,
                            message: "O telefone deve ter pelo menos 10 dígitos"
                          },
                          maxLength: {
                            value: 15,
                            message: "O telefone deve ter no máximo 15 caracteres"
                          }
                        })}
                        className={`h-12 border-2 rounded-xl ${
                          registerErrors.phone
                            ? "border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
                            : "border-primary/30 focus:border-primary focus:ring-2 focus:ring-primary/20"
                        }`}
                      />
                      {registerErrors.phone && (
                        <div className="flex items-center gap-2 text-sm text-red-600 mt-1">
                          <AlertCircle className="h-4 w-4" />
                          <span>{registerErrors.phone.message}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="vehicle" className="text-sm font-semibold text-secondary-900 flex items-center gap-2">
                        <Car className="h-3 w-3 text-primary" />
                        Veículo principal
                      </Label>
                      <Input
                        id="vehicle"
                        placeholder="Ex: Corolla Preto 2022"
                        {...registerRegisterForm("vehicle", {
                          required: "O veículo é obrigatório",
                          minLength: {
                            value: 3,
                            message: "O veículo deve ter pelo menos 3 caracteres"
                          },
                          maxLength: {
                            value: 100,
                            message: "O veículo deve ter no máximo 100 caracteres"
                          }
                        })}
                        className={`h-12 border-2 rounded-xl ${
                          registerErrors.vehicle
                            ? "border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
                            : "border-primary/30 focus:border-primary focus:ring-2 focus:ring-primary/20"
                        }`}
                      />
                      {registerErrors.vehicle && (
                        <div className="flex items-center gap-2 text-sm text-red-600 mt-1">
                          <AlertCircle className="h-4 w-4" />
                          <span>{registerErrors.vehicle.message}</span>
                        </div>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="plate" className="text-sm font-semibold text-secondary-900 flex items-center gap-2">
                        <Car className="h-3 w-3 text-primary" />
                        Placa do veículo
                      </Label>
                      <Input
                        id="plate"
                        placeholder="Ex: ABC1234 ou ABC1D23"
                        maxLength={7}
                        {...registerRegisterForm("plate", {
                          setValueAs: (value: string) => {
                            if (!value) return value;
                            return value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 7);
                          },
                          pattern: {
                            value: /^[A-Z]{3}[0-9][A-Z0-9][0-9]{2}$|^[A-Z]{3}[0-9]{4}$/,
                            message: "Formato de placa inválido. Use ABC1234 ou ABC1D23"
                          },
                          validate: (value) => {
                            if (!value) return true; // Opcional
                            const cleaned = value.toUpperCase().replace(/[^A-Z0-9]/g, '');
                            if (cleaned.length < 7) {
                              return "A placa deve ter 7 caracteres";
                            }
                            return true;
                          }
                        })}
                        className={`h-12 border-2 rounded-xl ${
                          registerErrors.plate
                            ? "border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
                            : "border-primary/30 focus:border-primary focus:ring-2 focus:ring-primary/20"
                        }`}
                      />
                      {registerErrors.plate && (
                        <div className="flex items-center gap-2 text-sm text-red-600 mt-1">
                          <AlertCircle className="h-4 w-4" />
                          <span>{registerErrors.plate.message}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-semibold text-secondary-900 flex items-center gap-2">
                      <Mail className="h-3 w-3 text-primary" />
                      E-mail
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="seuemail@exemplo.com"
                      {...registerRegisterForm("email", {
                        required: "O e-mail é obrigatório",
                        pattern: {
                          value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                          message: "Formato de e-mail inválido"
                        },
                        maxLength: {
                          value: 255,
                          message: "O e-mail deve ter no máximo 255 caracteres"
                        }
                      })}
                      className={`h-12 border-2 rounded-xl ${
                        registerErrors.email
                          ? "border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
                          : "border-primary/30 focus:border-primary focus:ring-2 focus:ring-primary/20"
                      }`}
                    />
                    {registerErrors.email && (
                      <div className="flex items-center gap-2 text-sm text-red-600 mt-1">
                        <AlertCircle className="h-4 w-4" />
                        <span>{registerErrors.email.message}</span>
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="register-password" className="text-sm font-semibold text-secondary-900 flex items-center gap-2">
                      <Lock className="h-3 w-3 text-primary" />
                      Senha
                    </Label>
                    <Input
                      id="register-password"
                      type="password"
                      placeholder="Mínimo 6 caracteres"
                      {...registerRegisterForm("password", {
                        required: "A senha é obrigatória",
                        minLength: {
                          value: 6,
                          message: "A senha deve ter pelo menos 6 caracteres"
                        },
                        maxLength: {
                          value: 100,
                          message: "A senha deve ter no máximo 100 caracteres"
                        }
                      })}
                      className={`h-12 border-2 rounded-xl ${
                        registerErrors.password
                          ? "border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
                          : "border-primary/30 focus:border-primary focus:ring-2 focus:ring-primary/20"
                      }`}
                    />
                    {registerErrors.password && (
                      <div className="flex items-center gap-2 text-sm text-red-600 mt-1">
                        <AlertCircle className="h-4 w-4" />
                        <span>{registerErrors.password.message}</span>
                      </div>
                    )}
                  </div>
                  <Button
                    type="submit"
                    className="w-full h-12 bg-gradient-to-r from-primary to-accent text-white shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-[1.02]"
                    disabled={loading || isRegisterSubmitting}
                  >
                    {loading || isRegisterSubmitting ? (
                      <span className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        Criando conta...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <CheckCircle className="h-5 w-5" />
                        Cadastrar
                      </span>
                    )}
                  </Button>
                </form>
              )}

              {/* Mensagens de Feedback */}
              {error && (
                <div className="mt-4 rounded-xl bg-red-50 border-2 border-red-200 p-4 flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm font-medium text-red-800">{error}</p>
                </div>
              )}

              {/* Link para Admin */}
              <div className="mt-6 pt-6 border-t-2 border-primary/20">
                <p className="text-center text-sm text-secondary-600">
                  É administrador?{" "}
                  <Link
                    to="/dashboard"
                    className="font-semibold text-primary hover:text-accent transition-colors underline decoration-2 underline-offset-2"
                  >
                    Acesse o painel
                  </Link>
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Card Informativo */}
          <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-2 border-blue-300/30 shadow-xl hidden lg:block">
            <CardHeader className="space-y-2 border-b-2 border-primary/20 pb-4">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-gradient-to-br from-primary to-accent p-2.5 shadow-lg">
                  <Shield className="h-5 w-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-2xl font-bold text-secondary-900">
                    Por que escolher DetailPrime?
                  </CardTitle>
                  <p className="text-sm text-secondary-600 mt-1">
                    Seus serviços em um só lugar
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="rounded-lg bg-gradient-to-br from-primary to-accent p-2 shadow-md flex-shrink-0">
                    <Calendar className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-secondary-900 mb-1">Agendamento Fácil</h3>
                    <p className="text-sm text-secondary-600">
                      Agende seus serviços de lavagem de forma rápida e intuitiva, escolhendo o melhor horário para você.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="rounded-lg bg-gradient-to-br from-primary to-accent p-2 shadow-md flex-shrink-0">
                    <CheckCircle className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-secondary-900 mb-1">Acompanhamento em Tempo Real</h3>
                    <p className="text-sm text-secondary-600">
                      Receba notificações por WhatsApp sobre o status do seu agendamento e acompanhe em tempo real.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="rounded-lg bg-gradient-to-br from-primary to-accent p-2 shadow-md flex-shrink-0">
                    <Car className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-secondary-900 mb-1">Histórico Completo</h3>
                    <p className="text-sm text-secondary-600">
                      Visualize todo o histórico de serviços do seu veículo e gerencie seus agendamentos futuros.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="rounded-lg bg-gradient-to-br from-primary to-accent p-2 shadow-md flex-shrink-0">
                    <Shield className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-secondary-900 mb-1">Seguro e Confiável</h3>
                    <p className="text-sm text-secondary-600">
                      Seus dados estão protegidos e você pode cancelar agendamentos com até 1 hora de antecedência.
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl bg-gradient-to-br from-primary/10 to-accent/10 border-2 border-primary/30 p-5 mt-6">
                <p className="text-sm font-semibold text-secondary-900 mb-2">
                  💡 Dica para novos usuários
                </p>
                <p className="text-xs text-secondary-700">
                  Após criar sua conta, você receberá um e-mail de confirmação. Em seguida, poderá agendar seus primeiros serviços!
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

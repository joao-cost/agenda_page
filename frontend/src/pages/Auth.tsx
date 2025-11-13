import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Label } from "../components/ui/Label";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/Card";
import { useAuthStore } from "../store/auth";

type AuthMode = "login" | "register";

interface LoginForm {
  login: string;
  password: string;
}

interface RegisterForm {
  name: string;
  phone: string;
  vehicle: string;
  email: string;
  password: string;
}

export function AuthPage() {
  const [mode, setMode] = useState<AuthMode>("login");
  const navigate = useNavigate();
  const location = useLocation();
  const { login, register: registerUser, loading, error } = useAuthStore();

  const {
    register,
    handleSubmit,
    formState: { isSubmitting }
  } = useForm<LoginForm>();

  const {
    register: registerRegisterForm,
    handleSubmit: handleRegisterSubmit,
    formState: { isSubmitting: isRegisterSubmitting }
  } = useForm<RegisterForm>();

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
    <div className="flex h-full items-center justify-center bg-primary/5 px-6 py-16 overflow-y-auto">
      <Card className="w-full max-w-lg bg-white">
        <CardHeader>
          <CardTitle className="text-center text-2xl text-secondary-900">
            {mode === "login" ? "Bem-vindo de volta" : "Crie sua conta"}
          </CardTitle>
          <p className="text-center text-sm text-secondary-600">
            {mode === "login"
              ? "Acesse sua conta para gerenciar agendamentos ou acompanhar o status."
              : "Cadastre-se para agendar serviços e acompanhar seus veículos."}
          </p>
        </CardHeader>
        <CardContent>
          <div className="mb-6 grid grid-cols-2 gap-2">
            <Button variant={mode === "login" ? "primary" : "secondary"} onClick={() => setMode("login")}>
              Entrar
            </Button>
            <Button
              variant={mode === "register" ? "primary" : "secondary"}
              onClick={() => setMode("register")}
            >
              Criar conta
            </Button>
          </div>

          {mode === "login" ? (
            <form onSubmit={handleSubmit(onSubmitLogin)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="login">E-mail ou login</Label>
                <Input id="login" type="email" placeholder="seuemail@exemplo.com" {...register("login", { required: true })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <Input id="password" type="password" placeholder="********" {...register("password", { required: true })} />
              </div>
              <Button type="submit" className="w-full" disabled={loading || isSubmitting}>
                {loading || isSubmitting ? "Entrando..." : "Entrar"}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleRegisterSubmit(onSubmitRegister)} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome completo</Label>
                  <Input id="name" placeholder="Seu nome" {...registerRegisterForm("name", { required: true })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Telefone / WhatsApp</Label>
                  <Input id="phone" placeholder="(11) 99999-9999" {...registerRegisterForm("phone", { required: true })} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="vehicle">Veículo principal</Label>
                <Input id="vehicle" placeholder="Ex: Corolla Preto 2022" {...registerRegisterForm("vehicle", { required: true })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input id="email" type="email" placeholder="seuemail@exemplo.com" {...registerRegisterForm("email", { required: true })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="register-password">Senha</Label>
                <Input
                  id="register-password"
                  type="password"
                  placeholder="********"
                  {...registerRegisterForm("password", { required: true, minLength: 6 })}
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading || isRegisterSubmitting}>
                {loading || isRegisterSubmitting ? "Criando conta..." : "Cadastrar"}
              </Button>
            </form>
          )}

          {error && <p className="mt-4 text-center text-sm font-medium text-red-600">{error}</p>}

          <p className="mt-6 text-center text-sm text-secondary-500">
            é administrador?{" "}
            <Link to="/dashboard" className="font-semibold text-primary underline">
              acesse o painel
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}



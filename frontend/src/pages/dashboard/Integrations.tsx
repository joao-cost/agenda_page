import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/Card";
import { Label } from "../../components/ui/Label";
import { Input } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";
import { Badge } from "../../components/ui/Badge";
import {
  fetchEvolutionSettings,
  updateEvolutionSettings,
  type EvolutionSettings
} from "../../api/settings";

export function DashboardIntegrations() {
  const [form, setForm] = useState<EvolutionSettings>({
    domain: "",
    token: "",
    session: ""
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const data = await fetchEvolutionSettings();
        setForm({
          domain: data.domain ?? "",
          token: data.token ?? "",
          session: data.session ?? ""
        });
      } catch (err) {
        console.error(err);
        setError("Não foi possível carregar as configurações atuais.");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  const handleChange = (field: keyof EvolutionSettings, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setFeedback(null);
    setError(null);
    try {
      await updateEvolutionSettings({
        domain: form.domain.trim(),
        token: form.token.trim(),
        session: form.session?.trim()
      });
      setFeedback("Configurações salvas com sucesso! A API já pode ser utilizada.");
    } catch (err) {
      console.error(err);
      setError("Erro ao salvar configurações. Verifique os dados e tente novamente.");
    } finally {
      setSaving(false);
    }
  };

  const isConnected = Boolean(form.domain && form.token);

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-2">
        <Badge variant="secondary" className="bg-primary/10 text-primary w-fit">
          Integrações
        </Badge>
        <h1 className="text-2xl font-semibold text-secondary-900">Conectar Evolution API</h1>
        <p className="text-sm text-secondary-600 max-w-2xl">
          Informe o domínio e o token gerados no painel da Evolution API para habilitar as notificações
          via WhatsApp. Consulte a documentação oficial para criar sessões ou recuperar seus dados de acesso.
        </p>
        <p className="text-xs text-secondary-500 flex items-center gap-2">
          Status:
          <span
            className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${
              isConnected ? "bg-primary/10 text-primary" : "bg-secondary-100 text-secondary-600"
            }`}
          >
            {isConnected ? "Conectado" : "Não configurado"}
          </span>
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,420px)_1fr]">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg text-secondary-900">
              Credenciais da Evolution API
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <Label htmlFor="domain">Domínio da API</Label>
                <Input
                  id="domain"
                  placeholder="https://seu-dominio.evolution-api.com"
                  value={form.domain}
                  onChange={(event) => handleChange("domain", event.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="token">Token de acesso</Label>
                <Input
                  id="token"
                  placeholder="token de autenticação"
                  value={form.token}
                  onChange={(event) => handleChange("token", event.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="session">ID da sessão (opcional)</Label>
                <Input
                  id="session"
                  placeholder="Nome da sessão (ex.: detailprime-session)"
                  value={form.session ?? ""}
                  onChange={(event) => handleChange("session", event.target.value)}
                />
                <p className="text-xs text-secondary-500">
                  Utilize para reutilizar uma sessão existente ou deixe em branco para gerar via API.
                </p>
              </div>
              <Button type="submit" disabled={saving} className="w-full">
                {saving ? "Salvando..." : "Salvar configurações"}
              </Button>
              {feedback && (
                <p className="text-sm font-medium text-primary" role="status">
                  {feedback}
                </p>
              )}
              {error && (
                <p className="text-sm font-medium text-red-600" role="alert">
                  {error}
                </p>
              )}
            </form>
          </CardContent>
        </Card>

        <Card className="bg-white">
          <CardHeader>
            <CardTitle className="text-lg text-secondary-900">Passo a passo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-secondary-600">
            <ol className="space-y-3 list-decimal pl-4">
              <li>
                Acesse a documentação oficial da Evolution API e gere seu <strong>token</strong> e{" "}
                <strong>domínio</strong> de acesso. Consulte o guia público{" "}
                <a
                  href="https://www.postman.com/agenciadgcode/evolution-api/collection/nm0wqgt/evolution-api-v2-3"
                  target="_blank"
                  rel="noreferrer"
                  className="text-primary underline"
                >
                  disponível no Postman
                </a>
                .
              </li>
              <li>
                Se desejar vincular a uma sessão existente, informe o <strong>session name</strong>.
                Caso contrário, deixe em branco e crie a sessão posteriormente via API.
              </li>
              <li>
                Após salvar, os disparos automáticos de novos agendamentos utilizarão essas credenciais.
                Faça um teste criando um agendamento manual pelo painel.
              </li>
            </ol>
            <div className="rounded-xl border border-secondary-100 bg-primary/5 p-4">
              <p className="text-secondary-700">
                Precisa de ajuda? Nosso time pode configurar tudo para você. Envie uma mensagem para
                <span className="font-medium text-primary"> suporte@detailprime.com</span>.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
      {loading && <p className="text-sm text-secondary-500">Carregando configurações...</p>}
    </div>
  );
}


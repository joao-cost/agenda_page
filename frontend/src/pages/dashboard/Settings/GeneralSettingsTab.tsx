import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/Card";
import { Label } from "../../../components/ui/Label";
import { Input } from "../../../components/ui/Input";
import { Button } from "../../../components/ui/Button";
import { Badge } from "../../../components/ui/Badge";
import { MiniCalendar } from "../../../components/ui/MiniCalendar";
import { fetchGeneralSettings, updateGeneralSettings, type GeneralSettings } from "../../../api/settings";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const DAYS_OF_WEEK = [
  { value: 0, label: "Domingo", short: "Dom" },
  { value: 1, label: "Segunda", short: "Seg" },
  { value: 2, label: "Terça", short: "Ter" },
  { value: 3, label: "Quarta", short: "Qua" },
  { value: 4, label: "Quinta", short: "Qui" },
  { value: 5, label: "Sexta", short: "Sex" },
  { value: 6, label: "Sábado", short: "Sáb" }
];

export function GeneralSettingsTab() {
  const [settings, setSettings] = useState<GeneralSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [autoSaving, setAutoSaving] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const data = await fetchGeneralSettings();
        setSettings(data);
      } catch (err) {
        console.error(err);
        setError("Não foi possível carregar as configurações.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleWorkDayToggle = (dayValue: number) => {
    if (!settings) return;
    const workDaysArray = settings.workDays.split(",").map(Number);
    const index = workDaysArray.indexOf(dayValue);
    
    if (index > -1) {
      workDaysArray.splice(index, 1);
    } else {
      workDaysArray.push(dayValue);
    }
    
    setSettings({
      ...settings,
      workDays: workDaysArray.sort((a, b) => a - b).join(",")
    });
  };

  const handleDateToggle = async (date: string) => {
    if (!settings) return;
    
    const closedDates = [...settings.closedDates];
    const index = closedDates.indexOf(date);
    
    if (index > -1) {
      // Remover se já está fechada
      closedDates.splice(index, 1);
    } else {
      // Adicionar se não está fechada
      closedDates.push(date);
    }
    
    const updatedSettings = {
      ...settings,
      closedDates: closedDates.sort()
    };
    
    setSettings(updatedSettings);
    
    // Salvar automaticamente - enviar apenas os campos necessários
    setAutoSaving(true);
    setError(null);
    try {
      await updateGeneralSettings({
        closedDates: closedDates.sort()
      });
      setFeedback("Data atualizada com sucesso!");
      setTimeout(() => setFeedback(null), 2000);
    } catch (err: any) {
      console.error("Erro ao salvar:", err);
      const errorMsg = err.response?.data?.errors 
        ? JSON.stringify(err.response.data.errors)
        : err.response?.data?.message || "Erro ao salvar data. Tente novamente.";
      setError(errorMsg);
      setTimeout(() => setError(null), 3000);
    } finally {
      setAutoSaving(false);
    }
  };

  const handleAutoSave = async () => {
    if (!settings) return;
    setAutoSaving(true);
    try {
      // Enviar apenas os campos necessários
      await updateGeneralSettings({
        closedDates: settings.closedDates
      });
      setFeedback("Salvo automaticamente!");
      setTimeout(() => setFeedback(null), 2000);
    } catch (err) {
      console.error(err);
    } finally {
      setAutoSaving(false);
    }
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;

    setSaving(true);
    setFeedback(null);
    setError(null);
    try {
      // Enviar apenas os campos que podem ser atualizados
      const payload: any = {
        workStartHour: settings.workStartHour,
        workEndHour: settings.workEndHour,
        workDays: settings.workDays,
        closedDates: settings.closedDates
      };
      
      // Só incluir adminPhone se não for vazio/null
      if (settings.adminPhone && settings.adminPhone.trim() !== "") {
        payload.adminPhone = settings.adminPhone;
      } else {
        payload.adminPhone = null;
      }
      
      await updateGeneralSettings(payload);
      setFeedback("Configurações salvas com sucesso!");
    } catch (err: any) {
      console.error("Erro ao salvar:", err);
      const errorMsg = err.response?.data?.errors 
        ? JSON.stringify(err.response.data.errors)
        : err.response?.data?.message || "Erro ao salvar configurações.";
      setError(errorMsg);
    } finally {
      setSaving(false);
    }
  };

  if (loading || !settings) {
    return <p className="text-sm text-secondary-500">Carregando configurações...</p>;
  }

  const workDaysArray = settings.workDays.split(",").map(Number);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Horários de Atendimento */}
        <Card className="bg-gradient-to-br from-white via-white to-primary/5 border-2 border-primary/20 shadow-xl">
          <CardHeader className="border-b border-primary/20 pb-4">
            <CardTitle className="text-xl font-bold text-secondary-900">Horários de Atendimento</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="workStartHour">Horário de Início</Label>
                <Input
                  id="workStartHour"
                  type="number"
                  min="0"
                  max="23"
                  value={settings.workStartHour}
                  onChange={(e) =>
                    setSettings({ ...settings, workStartHour: parseInt(e.target.value) || 0 })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="workEndHour">Horário de Término</Label>
                <Input
                  id="workEndHour"
                  type="number"
                  min="0"
                  max="23"
                  value={settings.workEndHour}
                  onChange={(e) =>
                    setSettings({ ...settings, workEndHour: parseInt(e.target.value) || 0 })
                  }
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Telefone do Administrador */}
        <Card className="bg-gradient-to-br from-white via-white to-primary/5 border-2 border-primary/20 shadow-xl">
          <CardHeader className="border-b border-primary/20 pb-4">
            <CardTitle className="text-xl font-bold text-secondary-900">Telefone do Administrador</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            <div className="space-y-2">
              <Label htmlFor="adminPhone">Telefone para Notificações</Label>
              <Input
                id="adminPhone"
                type="text"
                placeholder="Ex: (67) 99999-9999"
                value={settings.adminPhone || ""}
                onChange={(e) =>
                  setSettings({ ...settings, adminPhone: e.target.value })
                }
              />
              <p className="text-xs text-secondary-600">
                Telefone do administrador que receberá notificações de novos agendamentos (30 segundos após o cliente)
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Dias de Atendimento */}
      <Card className="bg-gradient-to-br from-white via-white to-primary/5 border-2 border-primary/20 shadow-xl">
        <CardHeader className="border-b border-primary/20 pb-4">
          <CardTitle className="text-xl font-bold text-secondary-900">Dias de Atendimento</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid grid-cols-7 gap-3">
            {DAYS_OF_WEEK.map((day) => {
              const isSelected = workDaysArray.includes(day.value);
              return (
                <button
                  key={day.value}
                  type="button"
                  onClick={() => handleWorkDayToggle(day.value)}
                  className={`rounded-xl border-2 p-3 text-sm font-semibold transition-all ${
                    isSelected
                      ? "bg-gradient-to-r from-primary to-accent text-white border-primary shadow-lg"
                      : "bg-white/50 border-primary/20 text-secondary-600 hover:border-primary/40"
                  }`}
                >
                  {day.short}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Datas Fechadas */}
      <Card className="bg-gradient-to-br from-white via-white to-primary/5 border-2 border-primary/20 shadow-xl">
        <CardHeader className="border-b border-primary/20 pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-bold text-secondary-900">Datas Fechadas (Feriados)</CardTitle>
            {autoSaving && (
              <span className="text-xs text-primary font-medium">Salvando...</span>
            )}
          </div>
          <p className="text-sm text-secondary-600 mt-2">
            Clique nos dias do calendário para abrir/fechar. Feriados nacionais são destacados automaticamente.
          </p>
        </CardHeader>
        <CardContent className="space-y-4 pt-6">
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Calendário */}
            <div className="flex-shrink-0">
              <MiniCalendar
                closedDates={settings.closedDates}
                onDateToggle={handleDateToggle}
                onSave={handleAutoSave}
              />
            </div>

            {/* Lista de Datas Fechadas */}
            <div className="flex-1">
              <Label className="text-base font-semibold text-secondary-900 mb-3 block">
                Datas Fechadas ({settings.closedDates.length})
              </Label>
              {settings.closedDates.length === 0 ? (
                <div className="rounded-xl bg-secondary-50 border-2 border-secondary-200 p-6 text-center">
                  <p className="text-sm text-secondary-600">
                    Nenhuma data fechada. Clique no calendário para adicionar.
                  </p>
                </div>
              ) : (
                <div className="rounded-xl bg-white/50 border-2 border-primary/20 p-4 max-h-[400px] overflow-y-auto">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {settings.closedDates.map((date) => (
                      <Badge
                        key={date}
                        className="bg-red-500 text-white px-3 py-2 flex items-center justify-between gap-2 cursor-pointer hover:bg-red-600 transition-colors"
                        onClick={() => handleDateToggle(date)}
                      >
                        <span className="font-semibold">
                          {format(new Date(date + "T00:00:00"), "dd/MM/yyyy", { locale: ptBR })}
                        </span>
                        <span className="text-xs opacity-80 hover:opacity-100">×</span>
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Feedback e Botão Salvar */}
      <div className="flex items-center justify-between">
        <div>
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
        </div>
        <Button
          type="submit"
          disabled={saving}
          className="bg-gradient-to-r from-primary to-accent text-white shadow-lg hover:shadow-xl"
        >
          {saving ? "Salvando..." : "Salvar Configurações"}
        </Button>
      </div>
    </form>
  );
}


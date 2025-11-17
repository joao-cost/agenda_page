import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/Card";
import { Label } from "../../../components/ui/Label";
import { Input } from "../../../components/ui/Input";
import { Button } from "../../../components/ui/Button";
import { fetchGeneralSettings, updateGeneralSettings, type GeneralSettings, type Washer } from "../../../api/settings";
import { Plus, X } from "lucide-react";

export function MultiAgendaTab() {
  const [settings, setSettings] = useState<GeneralSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [newWasherName, setNewWasherName] = useState("");

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const data = await fetchGeneralSettings();
        setSettings({
          ...data,
          washers: data.washers || []
        });
      } catch (err) {
        console.error(err);
        setError("Não foi possível carregar as configurações.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleAddWasher = () => {
    if (!settings || !newWasherName.trim()) return;
    const newWasher: Washer = {
      id: `washer-${Date.now()}`,
      name: newWasherName.trim()
    };
    setSettings({
      ...settings,
      washers: [...settings.washers, newWasher]
    });
    setNewWasherName("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;

    setSaving(true);
    setFeedback(null);
    setError(null);
    try {
      // Preparar payload apenas com os campos que devem ser atualizados
      const payload: Partial<GeneralSettings> = {
        multiWasher: settings.multiWasher,
        maxConcurrentBookings: settings.maxConcurrentBookings,
        washers: settings.washers || []
      };
      
      await updateGeneralSettings(payload);
      setFeedback("Configurações salvas com sucesso!");
    } catch (err: any) {
      console.error("Erro ao salvar:", err);
      const errorMessage = err.response?.data?.message || err.response?.data?.errors 
        ? JSON.stringify(err.response.data.errors || err.response.data.message)
        : "Erro ao salvar configurações. Tente novamente.";
      setError(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-secondary-500">Carregando configurações...</p>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-red-600">Erro ao carregar configurações.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Multi Lavador */}
      <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-2 border-blue-300/30 shadow-xl">
        <CardHeader className="border-b border-primary/20 pb-4">
          <CardTitle className="text-xl font-bold text-secondary-900">Multi Lavador</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 pt-6">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="multiWasher" className="text-base font-semibold">
                Habilitar Multi Lavador
              </Label>
              <p className="text-xs text-secondary-600 mt-1">
                Permite múltiplos agendamentos no mesmo horário com diferentes lavadores
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                id="multiWasher"
                checked={settings.multiWasher}
                onChange={(e) =>
                  setSettings({ ...settings, multiWasher: e.target.checked })
                }
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-secondary-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-secondary-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-primary peer-checked:to-accent"></div>
            </label>
          </div>
          
          {settings.multiWasher && (
            <>
              <div className="space-y-2">
                <Label htmlFor="maxConcurrentBookings">Máximo de Agendamentos Simultâneos</Label>
                <Input
                  id="maxConcurrentBookings"
                  type="number"
                  min="1"
                  value={settings.maxConcurrentBookings}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      maxConcurrentBookings: parseInt(e.target.value) || 1
                    })
                  }
                />
                <p className="text-xs text-secondary-600">
                  Quantos agendamentos podem ocorrer no mesmo horário para cada lavador
                </p>
              </div>
              
              <div className="space-y-3 pt-4 border-t border-primary/20">
                <Label className="text-base font-semibold">Lavadores Cadastrados</Label>
                <div className="space-y-2">
                  {settings.washers.length === 0 ? (
                    <p className="text-sm text-secondary-500 italic">
                      Nenhum lavador cadastrado. Adicione pelo menos um lavador para usar o modo multi-lavador.
                    </p>
                  ) : (
                    settings.washers.map((washer) => (
                      <div
                        key={washer.id}
                        className="flex items-center justify-between rounded-xl border-2 border-primary/20 bg-white/50 p-3"
                      >
                        <span className="font-semibold text-secondary-900">{washer.name}</span>
                        <Button
                          type="button"
                          variant="outline"
                          className="h-8 w-8 p-0 border-red-300 text-red-700 hover:bg-red-50"
                          onClick={() => {
                            setSettings({
                              ...settings,
                              washers: settings.washers.filter((w) => w.id !== washer.id)
                            });
                          }}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))
                  )}
                </div>
                <div className="flex gap-2">
                  <Input
                    placeholder="Nome do lavador (ex: Lavador A)"
                    value={newWasherName}
                    onChange={(e) => setNewWasherName(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddWasher();
                      }
                    }}
                  />
                  <Button
                    type="button"
                    onClick={handleAddWasher}
                    className="bg-gradient-to-r from-primary to-accent text-white shadow-lg"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar
                  </Button>
                </div>
              </div>
            </>
          )}
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


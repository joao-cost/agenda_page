import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { listClients, createClient, updateClient } from "../../api/clients";
import type { Client } from "../../types";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Label } from "../../components/ui/Label";
import { Badge } from "../../components/ui/Badge";
import { Users, UserPlus, Phone, Car, FileText, Sparkles, CheckCircle, AlertCircle, XCircle } from "lucide-react";

interface ClientForm {
  name: string;
  phone: string;
  vehicle: string;
  plate?: string;
  notes?: string;
}

export function DashboardClients() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [editingClient, setEditingClient] = useState<Client | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { isSubmitting }
  } = useForm<ClientForm>();

  useEffect(() => {
    async function fetchClients() {
      try {
        const data = await listClients();
        setClients(data);
      } catch (error) {
        console.error(error);
        setError("Não foi possível carregar os clientes.");
      } finally {
        setLoading(false);
      }
    }
    fetchClients();
  }, []);

  const onSubmit = async (data: ClientForm) => {
    try {
      if (editingClient) {
        const updated = await updateClient(editingClient.id, data);
        setClients((prev) => prev.map((client) => (client.id === updated.id ? updated : client)));
        setSuccess("Cliente atualizado com sucesso!");
        setEditingClient(null);
      } else {
        const client = await createClient(data);
        setClients((prev) => [client, ...prev]);
        setSuccess("Cliente cadastrado com sucesso!");
      }
      reset();
      setError(null);
    } catch (error) {
      console.error(error);
      setError(editingClient ? "Erro ao atualizar cliente." : "Erro ao cadastrar cliente.");
      setSuccess(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-white to-accent/5 py-6 md:py-10">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 sm:px-6">
        {/* Header melhorado */}
        <header className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-primary to-accent p-6 md:p-8 text-white shadow-2xl">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48Y2lyY2xlIGN4PSIzMCIgY3k9IjMwIiByPSIyMCIvPjwvZz48L2c+PC9zdmc+')] opacity-20"></div>
          <div className="relative z-10 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-yellow-300" />
                <span className="text-xs font-bold uppercase tracking-wider text-yellow-300">
                  Gestão de Clientes
                </span>
              </div>
              <h1 className="text-3xl font-bold md:text-4xl lg:text-5xl">
                Clientes Cadastrados
                <br />
                <span className="text-primary-foreground/90">Gerencie sua base de clientes</span>
              </h1>
              <p className="text-sm text-primary-foreground/90 md:text-base max-w-2xl">
                Cadastre novos clientes, edite informações e mantenha seus dados sempre atualizados.
              </p>
            </div>
            <div className="rounded-2xl bg-white/20 backdrop-blur-sm border border-white/30 px-6 py-4 text-white shadow-xl">
              <div className="flex items-center gap-2 mb-2">
                <Users className="h-4 w-4" />
                <p className="text-xs font-semibold uppercase tracking-wide">Total de Clientes</p>
              </div>
              <p className="text-3xl font-bold">{clients.length}</p>
            </div>
          </div>
        </header>

        <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
          {/* Lista de Clientes */}
          <Card className="bg-gradient-to-br from-white via-white to-primary/5 border-2 border-primary/20 shadow-xl">
            <CardHeader className="space-y-2 border-b-2 border-primary/20 pb-4">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-gradient-to-br from-primary to-accent p-2.5 shadow-lg">
                  <Users className="h-5 w-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-2xl font-bold text-secondary-900">Clientes cadastrados</CardTitle>
                  <p className="text-sm text-secondary-600 mt-1">
                    Visualize e gerencie todos os clientes
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              {loading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                  <p className="text-sm font-medium text-secondary-600">Carregando clientes...</p>
                </div>
              ) : error ? (
                <div className="rounded-xl bg-red-50 border-2 border-red-200 p-6 text-center">
                  <AlertCircle className="h-8 w-8 text-red-600 mx-auto mb-3" />
                  <p className="text-sm font-medium text-red-800">{error}</p>
                </div>
              ) : clients.length === 0 ? (
                <div className="text-center py-12 rounded-2xl bg-secondary-50 border-2 border-secondary-200">
                  <Users className="h-12 w-12 text-secondary-400 mx-auto mb-3" />
                  <p className="text-sm font-medium text-secondary-600">Nenhum cliente cadastrado ainda.</p>
                  <p className="text-xs text-secondary-500 mt-1">Cadastre seu primeiro cliente ao lado</p>
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  {clients.map((client) => (
                    <div
                      key={client.id}
                      className="rounded-2xl border-2 border-primary/20 bg-gradient-to-br from-white to-primary/5 p-5 shadow-lg hover:shadow-xl transition-all hover:border-primary/40 hover:scale-[1.02]"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h3 className="text-lg font-bold text-secondary-900 mb-1">{client.name}</h3>
                          <Badge variant="secondary" className="text-xs bg-secondary-100 text-secondary-700">
                            Cliente desde {format(new Date(client.createdAt), "dd/MM/yyyy", { locale: ptBR })}
                          </Badge>
                        </div>
                        <Button
                          variant="secondary"
                          size="sm"
                          className="border-primary/30 bg-primary/10 text-primary hover:bg-primary/20"
                          onClick={() => {
                            setEditingClient(client);
                            reset({
                              name: client.name,
                              phone: client.phone,
                              vehicle: client.vehicle,
                              plate: client.plate,
                              notes: client.notes
                            });
                            setSuccess(null);
                            setError(null);
                          }}
                        >
                          Editar
                        </Button>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm text-secondary-700">
                          <Phone className="h-4 w-4 text-primary" />
                          <span className="font-medium">{client.phone}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-secondary-700">
                          <Car className="h-4 w-4 text-primary" />
                          <span className="font-medium">{client.vehicle}</span>
                          {client.plate && (
                            <Badge className="bg-gradient-to-r from-primary to-accent text-white text-xs font-bold shadow-md">
                              {client.plate}
                            </Badge>
                          )}
                        </div>
                        {client.notes && (
                          <div className="flex items-start gap-2 text-sm text-secondary-600 pt-2 border-t border-primary/10">
                            <FileText className="h-4 w-4 text-primary mt-0.5" />
                            <span className="flex-1">{client.notes}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Formulário de Cadastro/Edição */}
          <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-2 border-blue-300/30 shadow-xl flex flex-col overflow-hidden flex-shrink-0 sticky top-6 h-fit">
            <CardHeader className="space-y-2 border-b-2 border-primary/20 pb-4">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-gradient-to-br from-primary to-accent p-2.5 shadow-lg">
                  <UserPlus className="h-5 w-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-xl font-bold text-secondary-900">
                    {editingClient ? "Editar cliente" : "Cadastrar novo cliente"}
                  </CardTitle>
                  <p className="text-xs text-secondary-600 mt-1">
                    {editingClient ? "Atualize as informações do cliente" : "Preencha os dados abaixo"}
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm font-semibold text-secondary-900 flex items-center gap-2">
                    <Users className="h-3 w-3 text-primary" />
                    Nome completo
                  </Label>
                  <Input 
                    id="name" 
                    {...register("name", { required: true })}
                    className="h-11 border-2 border-primary/30 focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-xl"
                    placeholder="Ex: João Silva"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-sm font-semibold text-secondary-900 flex items-center gap-2">
                    <Phone className="h-3 w-3 text-primary" />
                    Telefone
                  </Label>
                  <Input 
                    id="phone" 
                    {...register("phone", { required: true })}
                    className="h-11 border-2 border-primary/30 focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-xl"
                    placeholder="Ex: 66996586980"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="vehicle" className="text-sm font-semibold text-secondary-900 flex items-center gap-2">
                    <Car className="h-3 w-3 text-primary" />
                    Veículo
                  </Label>
                  <Input 
                    id="vehicle" 
                    placeholder="Ex: Honda Civic, Fiat Uno..." 
                    {...register("vehicle", { required: true })}
                    className="h-11 border-2 border-primary/30 focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="plate" className="text-sm font-semibold text-secondary-900 flex items-center gap-2">
                    <Car className="h-3 w-3 text-primary" />
                    Placa do veículo
                  </Label>
                  <Input 
                    id="plate" 
                    placeholder="Ex: ABC1234 ou ABC1D23" 
                    {...register("plate", {
                      setValueAs: (value: string) => {
                        if (!value) return value;
                        return value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 7);
                      }
                    })}
                    maxLength={7}
                    className="h-11 border-2 border-primary/30 focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notes" className="text-sm font-semibold text-secondary-900 flex items-center gap-2">
                    <FileText className="h-3 w-3 text-primary" />
                    Observações
                  </Label>
                  <Input 
                    id="notes" 
                    placeholder="Preferências, cores, detalhes..." 
                    {...register("notes")}
                    className="h-11 border-2 border-primary/30 focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-xl"
                  />
                </div>
                <Button 
                  type="submit" 
                  className="w-full h-12 bg-gradient-to-r from-primary to-accent text-white shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-[1.02]" 
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <span className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      Salvando...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5" />
                      {editingClient ? "Salvar alterações" : "Cadastrar cliente"}
                    </span>
                  )}
                </Button>
                {editingClient && (
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full h-11 border-2 border-secondary-300 hover:bg-secondary-50"
                    onClick={() => {
                      setEditingClient(null);
                      reset();
                      setSuccess(null);
                      setError(null);
                    }}
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Cancelar edição
                  </Button>
                )}
              </form>
              
              {/* Mensagens de Feedback */}
              {success && (
                <div className="mt-4 rounded-xl bg-green-50 border-2 border-green-200 p-4 flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm font-medium text-green-800">{success}</p>
                </div>
              )}
              {error && (
                <div className="mt-4 rounded-xl bg-red-50 border-2 border-red-200 p-4 flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm font-medium text-red-800">{error}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

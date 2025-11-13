import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { listClients, createClient, updateClient } from "../../api/clients";
import type { Client } from "../../types";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Label } from "../../components/ui/Label";

interface ClientForm {
  name: string;
  phone: string;
  vehicle: string;
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
    } catch (error) {
      console.error(error);
      setError(editingClient ? "Erro ao atualizar cliente." : "Erro ao cadastrar cliente.");
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl text-secondary-900">Clientes cadastrados</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-secondary-500">Carregando clientes...</p>
          ) : error ? (
            <p className="text-sm text-red-600">{error}</p>
          ) : clients.length === 0 ? (
            <p className="text-sm text-secondary-500">Nenhum cliente cadastrado ainda.</p>
          ) : (
            <ul className="space-y-4">
              {clients.map((client) => (
                <li key={client.id} className="rounded-lg border border-secondary-100 bg-white p-4 shadow-sm">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-semibold text-secondary-900">{client.name}</h3>
                    <span className="text-xs text-secondary-500">
                      Cliente desde {new Date(client.createdAt).toLocaleDateString("pt-BR")}
                    </span>
                  </div>
                  <p className="text-sm text-secondary-600">Telefone: {client.phone}</p>
                  <p className="text-sm text-secondary-600">Veículo: {client.vehicle}</p>
                  {client.notes && <p className="text-xs text-secondary-500">Obs: {client.notes}</p>}
                  <div className="mt-3">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setEditingClient(client);
                        reset({
                          name: client.name,
                          phone: client.phone,
                          vehicle: client.vehicle,
                          notes: client.notes
                        });
                        setSuccess(null);
                        setError(null);
                      }}
                    >
                      Editar
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card className="bg-white">
        <CardHeader>
          <CardTitle className="text-xl text-secondary-900">
            {editingClient ? "Editar cliente" : "Cadastrar novo cliente"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome</Label>
              <Input id="name" {...register("name", { required: true })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Telefone</Label>
              <Input id="phone" {...register("phone", { required: true })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="vehicle">Veículo</Label>
              <Input id="vehicle" {...register("vehicle", { required: true })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Observações</Label>
              <Input id="notes" placeholder="Preferências, placas, cores..." {...register("notes")} />
            </div>
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting
                ? "Salvando..."
                : editingClient
                ? "Salvar alterações"
                : "Cadastrar cliente"}
            </Button>
            {editingClient && (
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => {
                  setEditingClient(null);
                  reset();
                  setSuccess(null);
                  setError(null);
                }}
              >
                Cancelar edição
              </Button>
            )}
          </form>
          {success && <p className="mt-4 text-sm font-medium text-primary">{success}</p>}
          {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        </CardContent>
      </Card>
    </div>
  );
}


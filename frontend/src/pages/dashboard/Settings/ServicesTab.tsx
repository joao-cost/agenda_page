import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/Card";
import { Label } from "../../../components/ui/Label";
import { Input } from "../../../components/ui/Input";
import { Button } from "../../../components/ui/Button";
import { Textarea } from "../../../components/ui/Textarea";
import { listServices, createService, updateService, deleteService } from "../../../api/services";
import type { Service } from "../../../types";

interface ServiceForm {
  name: string;
  description?: string;
  price: number;
  durationMin: number;
}

export function ServicesTab() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { isSubmitting }
  } = useForm<ServiceForm>();

  useEffect(() => {
    loadServices();
  }, []);

  async function loadServices() {
    setLoading(true);
    try {
      const data = await listServices();
      setServices(data);
    } catch (err) {
      console.error(err);
      setError("Não foi possível carregar os serviços.");
    } finally {
      setLoading(false);
    }
  }

  const onSubmit = async (data: ServiceForm) => {
    setSuccess(null);
    setError(null);
    try {
      if (editingService) {
        await updateService(editingService.id, data);
        setSuccess("Serviço atualizado com sucesso!");
      } else {
        await createService(data);
        setSuccess("Serviço criado com sucesso!");
      }
      reset();
      setEditingService(null);
      loadServices();
    } catch (err) {
      console.error(err);
      setError(editingService ? "Erro ao atualizar serviço." : "Erro ao criar serviço.");
    }
  };

  const handleEdit = (service: Service) => {
    setEditingService(service);
    reset({
      name: service.name,
      description: service.description || "",
      price: Number(service.price),
      durationMin: service.durationMin
    });
    setSuccess(null);
    setError(null);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este serviço?")) return;
    try {
      await deleteService(id);
      setSuccess("Serviço excluído com sucesso!");
      loadServices();
    } catch (err) {
      console.error(err);
      setError("Erro ao excluir serviço.");
    }
  };

  if (loading) {
    return <p className="text-sm text-secondary-500">Carregando serviços...</p>;
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
      <Card className="bg-gradient-to-br from-white via-white to-primary/5 border-2 border-primary/20 shadow-xl flex flex-col overflow-hidden">
        <CardHeader className="border-b border-primary/20 pb-4 flex-shrink-0">
          <CardTitle className="text-xl font-bold text-secondary-900">Serviços Cadastrados</CardTitle>
        </CardHeader>
        <CardContent className="flex-1 overflow-y-auto">
          {services.length === 0 ? (
            <p className="text-sm text-secondary-500">Nenhum serviço cadastrado ainda.</p>
          ) : (
            <div className="space-y-4">
              {services.map((service) => (
                <div
                  key={service.id}
                  className="rounded-xl border-2 border-primary/20 bg-white/50 p-4 shadow-md hover:shadow-lg transition-all"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-base font-bold text-secondary-900">{service.name}</h3>
                      {service.description && (
                        <p className="text-sm text-secondary-600 mt-1">{service.description}</p>
                      )}
                      <div className="flex items-center gap-4 mt-3">
                        <div>
                          <span className="text-xs text-secondary-500">Duração:</span>
                          <span className="ml-2 text-sm font-semibold text-secondary-900">
                            {service.durationMin} min
                          </span>
                        </div>
                        <div>
                          <span className="text-xs text-secondary-500">Preço:</span>
                          <span className="ml-2 text-sm font-bold text-primary">
                            {Number(service.price).toLocaleString("pt-BR", {
                              style: "currency",
                              currency: "BRL"
                            })}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <Button
                        variant="secondary"
                        className="border-primary/30 bg-primary/10 text-surface hover:bg-primary/20"
                        onClick={() => handleEdit(service)}
                      >
                        Editar
                      </Button>
                      <Button
                        variant="outline"
                        className="border-red-300 text-red-700 hover:bg-red-50"
                        onClick={() => handleDelete(service.id)}
                      >
                        Excluir
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-2 border-blue-300/30 shadow-xl flex flex-col overflow-hidden flex-shrink-0">
        <CardHeader className="border-b border-primary/20 pb-4 flex-shrink-0">
          <CardTitle className="text-xl font-bold text-secondary-900">
            {editingService ? "Editar Serviço" : "Novo Serviço"}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 overflow-y-auto">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome do Serviço *</Label>
              <Input id="name" {...register("name", { required: true })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                rows={3}
                {...register("description")}
                placeholder="Descreva o serviço..."
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="durationMin">Duração (minutos) *</Label>
                <Input
                  id="durationMin"
                  type="number"
                  min="1"
                  {...register("durationMin", { required: true, valueAsNumber: true })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="price">Preço (R$) *</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  min="0"
                  {...register("price", { required: true, valueAsNumber: true })}
                />
              </div>
            </div>
            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-primary to-accent text-white shadow-lg hover:shadow-xl"
              disabled={isSubmitting}
            >
              {isSubmitting
                ? "Salvando..."
                : editingService
                ? "Salvar Alterações"
                : "Criar Serviço"}
            </Button>
            {editingService && (
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => {
                  setEditingService(null);
                  reset();
                  setSuccess(null);
                  setError(null);
                }}
              >
                Cancelar Edição
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


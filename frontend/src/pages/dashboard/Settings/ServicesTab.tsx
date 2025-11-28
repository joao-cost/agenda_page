import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/Card";
import { Button } from "../../../components/ui/Button";
import { listServices, deleteService } from "../../../api/services";
import type { Service } from "../../../types";
import { ServiceModal } from "../../../components/modals/ServiceModal";
import { ConfirmDialog } from "../../../components/ui/ConfirmDialog";
import { Plus, Sparkles, Clock, DollarSign } from "lucide-react";

export function ServicesTab() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [serviceToDelete, setServiceToDelete] = useState<string | null>(null);

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

  const handleEdit = (service: Service) => {
    setEditingService(service);
    setIsModalOpen(true);
    setSuccess(null);
    setError(null);
  };

  const handleCreate = () => {
    setEditingService(null);
    setIsModalOpen(true);
    setSuccess(null);
    setError(null);
  };

  const handleDeleteClick = (id: string) => {
    setServiceToDelete(id);
    setDeleteConfirmOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!serviceToDelete) return;
    try {
      await deleteService(serviceToDelete);
      setSuccess("Serviço excluído com sucesso!");
      setDeleteConfirmOpen(false);
      setServiceToDelete(null);
      loadServices();
    } catch (err) {
      console.error(err);
      setError("Erro ao excluir serviço.");
      setDeleteConfirmOpen(false);
      setServiceToDelete(null);
    }
  };

  const handleModalSuccess = () => {
    setSuccess(editingService ? "Serviço atualizado com sucesso!" : "Serviço criado com sucesso!");
    setEditingService(null);
    loadServices();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-secondary-500">Carregando serviços...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-to-br from-white via-white to-primary/5 border-2 border-primary/20 shadow-xl">
        <CardHeader className="space-y-2 border-b-2 border-primary/20 pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-gradient-to-br from-primary to-accent p-2.5 shadow-lg">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-2xl font-bold text-secondary-900">Serviços Cadastrados</CardTitle>
                <p className="text-sm text-secondary-600 mt-1">
                  Gerencie todos os serviços disponíveis
                </p>
              </div>
            </div>
            <Button
              onClick={handleCreate}
              className="bg-gradient-to-r from-primary to-accent text-white shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-[1.02] font-bold"
            >
              <Plus className="h-5 w-5 mr-2" />
              Criar Serviço
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          {error && (
            <div className="mb-4 rounded-xl bg-red-50 border-2 border-red-200 p-4">
              <p className="text-sm font-medium text-red-800">{error}</p>
            </div>
          )}
          {success && (
            <div className="mb-4 rounded-xl bg-green-50 border-2 border-green-200 p-4">
              <p className="text-sm font-medium text-green-800">{success}</p>
            </div>
          )}
          {services.length === 0 ? (
            <div className="text-center py-12 rounded-2xl bg-secondary-50 border-2 border-secondary-200">
              <Sparkles className="h-12 w-12 text-secondary-400 mx-auto mb-3" />
              <p className="text-sm font-medium text-secondary-600">Nenhum serviço cadastrado ainda.</p>
              <p className="text-xs text-secondary-500 mt-1">Clique em "Criar Serviço" para começar</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {services.map((service) => (
                <div
                  key={service.id}
                  className="rounded-2xl border-2 border-primary/20 bg-gradient-to-br from-white to-primary/5 p-5 shadow-lg hover:shadow-xl transition-all hover:scale-[1.02]"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-secondary-900 mb-2">{service.name}</h3>
                      {service.description && (
                        <p className="text-sm text-secondary-600 mb-3 leading-relaxed">{service.description}</p>
                      )}
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 text-sm text-secondary-700">
                          <Clock className="h-4 w-4 text-primary" />
                          <span className="font-semibold">{service.durationMin} min</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-secondary-700">
                          <DollarSign className="h-4 w-4 text-primary" />
                          <span className="font-bold text-primary">
                            {Number(service.price).toLocaleString("pt-BR", {
                              style: "currency",
                              currency: "BRL"
                            })}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 pt-4 border-t border-primary/10">
                    <Button
                      className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 text-white border-0 shadow-md hover:shadow-lg hover:from-blue-600 hover:to-blue-700 transition-all font-semibold"
                      onClick={() => handleEdit(service)}
                    >
                      Editar
                    </Button>
                    <Button
                      className="flex-1 bg-gradient-to-r from-red-500 to-red-600 text-white border-0 shadow-md hover:shadow-lg hover:from-red-600 hover:to-red-700 transition-all font-semibold"
                      onClick={() => handleDeleteClick(service.id)}
                    >
                      Excluir
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <ServiceModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingService(null);
        }}
        service={editingService}
        onSuccess={handleModalSuccess}
      />

      <ConfirmDialog
        isOpen={deleteConfirmOpen}
        onClose={() => {
          setDeleteConfirmOpen(false);
          setServiceToDelete(null);
        }}
        onConfirm={handleDeleteConfirm}
        title="Excluir Serviço"
        message="Tem certeza que deseja excluir este serviço? Esta ação não pode ser desfeita."
        type="danger"
        confirmText="Excluir"
        cancelText="Cancelar"
      />
    </div>
  );
}

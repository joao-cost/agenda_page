import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Modal } from "../ui/Modal";
import { Label } from "../ui/Label";
import { Input } from "../ui/Input";
import { Button } from "../ui/Button";
import { Textarea } from "../ui/Textarea";
import { AlertDialog } from "../ui/AlertDialog";
import type { Service } from "../../types";
import { Sparkles, DollarSign, Clock, AlertCircle } from "lucide-react";

interface ServiceForm {
  name: string;
  description?: string;
  price: number;
  durationMin: number;
}

interface ServiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  service: Service | null;
  onSuccess: () => void;
}

export function ServiceModal({ isOpen, onClose, service, onSuccess }: ServiceModalProps) {
  const [alertDialog, setAlertDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type?: "error" | "success" | "info" | "warning";
  }>({ isOpen: false, title: "", message: "" });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<ServiceForm>({
    mode: "onChange"
  });

  useEffect(() => {
    if (isOpen) {
      if (service) {
        reset({
          name: service.name,
          description: service.description || "",
          price: Number(service.price),
          durationMin: service.durationMin
        });
      } else {
        reset({
          name: "",
          description: "",
          price: 0,
          durationMin: 30
        });
      }
    }
  }, [isOpen, service, reset]);

  const onSubmit = async (data: ServiceForm) => {
    try {
      if (service) {
        const { updateService } = await import("../../api/services");
        await updateService(service.id, data);
      } else {
        const { createService } = await import("../../api/services");
        await createService(data);
      }
      onSuccess();
      onClose();
    } catch (error) {
      console.error(error);
      setAlertDialog({
        isOpen: true,
        title: "Erro",
        message: service ? "Erro ao atualizar serviço." : "Erro ao criar serviço.",
        type: "error"
      });
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={service ? "Editar Serviço" : "Novo Serviço"} size="md">
      <div className="space-y-6">
        {/* Header melhorado */}
        <div className="flex items-center gap-3 pb-4 border-b-2 border-primary/20">
          <div className="rounded-xl bg-gradient-to-br from-primary to-accent p-2.5 shadow-lg">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-secondary-900">
              {service ? "Editar Serviço" : "Criar Novo Serviço"}
            </h3>
            <p className="text-xs text-secondary-600 mt-1">
              {service ? "Atualize as informações do serviço" : "Preencha os dados para criar um novo serviço"}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm font-semibold text-secondary-900">
              Nome do Serviço *
            </Label>
            <Input
              id="name"
              {...register("name", {
                required: "O nome do serviço é obrigatório",
                minLength: {
                  value: 3,
                  message: "O nome deve ter pelo menos 3 caracteres"
                },
                maxLength: {
                  value: 100,
                  message: "O nome deve ter no máximo 100 caracteres"
                },
                pattern: {
                  value: /^[a-zA-ZÀ-ÿ0-9\s\-'\.]+$/,
                  message: "O nome pode conter apenas letras, números, espaços e caracteres especiais (-, ', .)"
                }
              })}
              placeholder="Ex: Lavagem Express"
              className={`h-12 border-2 rounded-xl ${
                errors.name
                  ? "border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
                  : "border-primary/30 focus:border-primary focus:ring-2 focus:ring-primary/20"
              }`}
            />
            {errors.name && (
              <div className="flex items-center gap-2 text-sm text-red-600 mt-1">
                <AlertCircle className="h-4 w-4" />
                <span>{errors.name.message}</span>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm font-semibold text-secondary-900">
              Descrição
            </Label>
            <Textarea
              id="description"
              rows={3}
              {...register("description", {
                maxLength: {
                  value: 500,
                  message: "A descrição deve ter no máximo 500 caracteres"
                }
              })}
              placeholder="Descreva o serviço..."
              className={`resize-none border-2 rounded-xl ${
                errors.description
                  ? "border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
                  : "border-primary/30 focus:border-primary focus:ring-2 focus:ring-primary/20"
              }`}
            />
            {errors.description && (
              <div className="flex items-center gap-2 text-sm text-red-600 mt-1">
                <AlertCircle className="h-4 w-4" />
                <span>{errors.description.message}</span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="durationMin" className="text-sm font-semibold text-secondary-900 flex items-center gap-2">
                <Clock className="h-3 w-3 text-primary" />
                Duração (minutos) *
              </Label>
              <Input
                id="durationMin"
                type="number"
                min="1"
                step="1"
                {...register("durationMin", {
                  required: "A duração é obrigatória",
                  valueAsNumber: true,
                  min: {
                    value: 1,
                    message: "A duração deve ser no mínimo 1 minuto"
                  },
                  max: {
                    value: 1440,
                    message: "A duração deve ser no máximo 1440 minutos (24 horas)"
                  },
                  validate: (value) => {
                    if (!Number.isInteger(Number(value))) {
                      return "A duração deve ser um número inteiro";
                    }
                    return true;
                  }
                })}
                onKeyDown={(e) => {
                  // Permitir apenas números, backspace, delete, tab, arrow keys
                  if (!/[0-9]/.test(e.key) && !['Backspace', 'Delete', 'Tab', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
                    e.preventDefault();
                  }
                }}
                className={`h-12 border-2 rounded-xl ${
                  errors.durationMin
                    ? "border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
                    : "border-primary/30 focus:border-primary focus:ring-2 focus:ring-primary/20"
                }`}
              />
              {errors.durationMin && (
                <div className="flex items-center gap-2 text-sm text-red-600 mt-1">
                  <AlertCircle className="h-4 w-4" />
                  <span>{errors.durationMin.message}</span>
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="price" className="text-sm font-semibold text-secondary-900 flex items-center gap-2">
                <DollarSign className="h-3 w-3 text-primary" />
                Preço (R$) *
              </Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                min="0"
                {...register("price", {
                  required: "O preço é obrigatório",
                  valueAsNumber: true,
                  min: {
                    value: 0.01,
                    message: "O preço deve ser maior que zero"
                  },
                  max: {
                    value: 999999.99,
                    message: "O preço deve ser no máximo R$ 999.999,99"
                  },
                  validate: (value) => {
                    const numValue = Number(value);
                    if (isNaN(numValue) || numValue <= 0) {
                      return "O preço deve ser um número válido maior que zero";
                    }
                    // Verificar se tem no máximo 2 casas decimais
                    const decimalPlaces = (value.toString().split('.')[1] || '').length;
                    if (decimalPlaces > 2) {
                      return "O preço deve ter no máximo 2 casas decimais";
                    }
                    return true;
                  }
                })}
                onKeyDown={(e) => {
                  // Permitir apenas números, ponto, backspace, delete, tab, arrow keys
                  if (!/[0-9.]/.test(e.key) && !['Backspace', 'Delete', 'Tab', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
                    e.preventDefault();
                  }
                  // Prevenir múltiplos pontos
                  if (e.key === '.' && (e.target as HTMLInputElement).value.includes('.')) {
                    e.preventDefault();
                  }
                }}
                className={`h-12 border-2 rounded-xl ${
                  errors.price
                    ? "border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
                    : "border-primary/30 focus:border-primary focus:ring-2 focus:ring-primary/20"
                }`}
              />
              {errors.price && (
                <div className="flex items-center gap-2 text-sm text-red-600 mt-1">
                  <AlertCircle className="h-4 w-4" />
                  <span>{errors.price.message}</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t-2 border-primary/20">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1 h-12 border-2 border-secondary-300 hover:bg-secondary-50"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || Object.keys(errors).length > 0}
              className="flex-1 h-12 bg-gradient-to-r from-primary to-accent text-white shadow-xl hover:shadow-2xl hover:scale-[1.02] transition-all duration-200 font-bold disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Salvando...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5" />
                  {service ? "Salvar Alterações" : "Criar Serviço"}
                </span>
              )}
            </Button>
          </div>
        </form>
      </div>

      <AlertDialog
        isOpen={alertDialog.isOpen}
        onClose={() => setAlertDialog({ ...alertDialog, isOpen: false })}
        title={alertDialog.title}
        message={alertDialog.message}
        type={alertDialog.type}
      />
    </Modal>
  );
}

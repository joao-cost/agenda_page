import { Modal } from "./Modal";
import { Button } from "./Button";
import { AlertTriangle, CheckCircle, XCircle, Info } from "lucide-react";

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  type?: "warning" | "danger" | "info" | "success";
  confirmText?: string;
  cancelText?: string;
  loading?: boolean;
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  type = "warning",
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  loading = false
}: ConfirmDialogProps) {
  const handleConfirm = () => {
    onConfirm();
  };

  const iconColors = {
    warning: "text-yellow-600",
    danger: "text-red-600",
    info: "text-blue-600",
    success: "text-green-600"
  };

  const buttonColors = {
    warning: "bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700",
    danger: "bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700",
    info: "bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700",
    success: "bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
  };

  const icons = {
    warning: AlertTriangle,
    danger: XCircle,
    info: Info,
    success: CheckCircle
  };

  const Icon = icons[type];

  const bgColors = {
    warning: "bg-yellow-50",
    danger: "bg-red-50",
    info: "bg-blue-50",
    success: "bg-green-50"
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="" size="sm">
      <div className="space-y-6">
        <div className="flex items-start gap-4">
          <div className={`rounded-full p-3 ${iconColors[type]} ${bgColors[type]} flex-shrink-0`}>
            <Icon className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-secondary-900 mb-2">{title}</h3>
            <p className="text-sm text-secondary-700 leading-relaxed">{message}</p>
          </div>
        </div>

        <div className="flex gap-3 pt-4 border-t border-primary/20">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={loading}
            className="flex-1 border-2 border-secondary-300 hover:bg-secondary-50"
          >
            {cancelText}
          </Button>
          <Button
            type="button"
            onClick={handleConfirm}
            disabled={loading}
            className={`flex-1 text-white shadow-lg hover:shadow-xl transition-all ${buttonColors[type]}`}
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Processando...
              </span>
            ) : (
              confirmText
            )}
          </Button>
        </div>
      </div>
    </Modal>
  );
}


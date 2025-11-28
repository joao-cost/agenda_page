import { Modal } from "./Modal";
import { Button } from "./Button";
import { AlertCircle, CheckCircle, XCircle, Info } from "lucide-react";

interface AlertDialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  type?: "error" | "success" | "info" | "warning";
  buttonText?: string;
}

export function AlertDialog({
  isOpen,
  onClose,
  title,
  message,
  type = "info",
  buttonText = "OK"
}: AlertDialogProps) {
  const iconColors = {
    error: "text-red-600",
    success: "text-green-600",
    info: "text-blue-600",
    warning: "text-yellow-600"
  };

  const bgColors = {
    error: "bg-red-50",
    success: "bg-green-50",
    info: "bg-blue-50",
    warning: "bg-yellow-50"
  };

  const borderColors = {
    error: "border-red-200",
    success: "border-green-200",
    info: "border-blue-200",
    warning: "border-yellow-200"
  };

  const icons = {
    error: XCircle,
    success: CheckCircle,
    info: Info,
    warning: AlertCircle
  };

  const Icon = icons[type];

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

        <div className="flex justify-end pt-4 border-t border-primary/20">
          <Button
            type="button"
            onClick={onClose}
            className="bg-gradient-to-r from-primary to-accent text-white shadow-lg hover:shadow-xl px-6"
          >
            {buttonText}
          </Button>
        </div>
      </div>
    </Modal>
  );
}



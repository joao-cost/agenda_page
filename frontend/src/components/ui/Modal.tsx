import { useEffect } from "react";
import { X } from "lucide-react";
import { Button } from "./Button";
import { cn } from "../../utils/cn";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

export function Modal({ isOpen, onClose, title, children, size = "md", className }: ModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: "max-w-md",
    md: "max-w-2xl",
    lg: "max-w-4xl",
    xl: "max-w-6xl"
  };

  return (
    <>
      <div
        className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 max-h-screen overflow-hidden">
        <div
          className={cn(
            "relative w-full rounded-2xl border-2 border-primary/30 bg-white shadow-2xl max-h-[calc(100vh-2rem)] flex flex-col",
            sizeClasses[size],
            className
          )}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between border-b border-primary/20 px-4 sm:px-6 py-3 sm:py-4 flex-shrink-0">
            <h2 className="text-lg sm:text-xl font-bold text-secondary-900">{title}</h2>
            <button
              onClick={onClose}
              className="rounded-lg p-2 text-secondary-500 transition-colors hover:bg-secondary-100 hover:text-secondary-900"
              aria-label="Fechar"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="p-4 sm:p-6 overflow-y-auto flex-1 min-h-0">{children}</div>
        </div>
      </div>
    </>
  );
}


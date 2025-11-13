import { cn } from "../../utils/cn";
import type { ButtonHTMLAttributes } from "react";
import { Slot } from "@radix-ui/react-slot";

const baseStyles =
  "inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500 disabled:opacity-60 disabled:cursor-not-allowed";

const variants = {
  primary: "bg-gradient-to-r from-primary to-primary/80 text-primary-foreground hover:from-primary/90 hover:to-primary/70 shadow-md shadow-primary/20",
  secondary: "bg-white text-primary border border-primary/30 hover:bg-primary/10",
  outline: "border border-primary/30 text-secondary-700 hover:bg-primary/10"
} as const;

type ButtonVariant = keyof typeof variants;

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  asChild?: boolean;
}

export function Button({ className, variant = "primary", asChild, ...props }: ButtonProps) {
  const Component = asChild ? Slot : "button";
  return <Component className={cn(baseStyles, variants[variant], className)} {...props} />;
}


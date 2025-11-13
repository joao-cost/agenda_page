import type { LabelHTMLAttributes } from "react";
import { cn } from "../../utils/cn";

const baseStyles = "text-sm font-medium text-secondary-700";

type LabelProps = LabelHTMLAttributes<HTMLLabelElement>;

export function Label({ className, ...props }: LabelProps) {
  return <label className={cn(baseStyles, className)} {...props} />;
}



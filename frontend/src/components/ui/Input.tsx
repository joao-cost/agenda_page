import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "../../utils/cn";

const baseStyles =
  "w-full rounded-md border border-secondary-100 bg-white px-3 py-2 text-sm text-secondary-900 shadow-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300 placeholder:text-secondary-400 disabled:opacity-50";

type InputProps = InputHTMLAttributes<HTMLInputElement>;

export const Input = forwardRef<HTMLInputElement, InputProps>(({ className, ...props }, ref) => {
  return <input ref={ref} className={cn(baseStyles, className)} {...props} />;
});

Input.displayName = "Input";



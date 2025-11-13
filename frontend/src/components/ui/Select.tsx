import { forwardRef, type SelectHTMLAttributes } from "react";
import { cn } from "../../utils/cn";

const baseStyles =
  "w-full rounded-md border border-secondary-100 bg-white px-3 py-2 text-sm text-secondary-900 shadow-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300";

type SelectProps = SelectHTMLAttributes<HTMLSelectElement>;

export const Select = forwardRef<HTMLSelectElement, SelectProps>(({ className, children, ...props }, ref) => {
  return (
    <select ref={ref} className={cn(baseStyles, className)} {...props}>
      {children}
    </select>
  );
});

Select.displayName = "Select";



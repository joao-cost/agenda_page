import { cn } from "../../utils/cn";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "secondary" | "outline";
}

const variants = {
  default: "bg-primary text-primary-foreground",
  secondary: "bg-secondary-800 text-surface",
  outline: "border border-secondary-200 text-secondary-700"
};

export function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1 text-xs font-medium uppercase tracking-wide",
        variants[variant],
        className
      )}
      {...props}
    />
  );
}



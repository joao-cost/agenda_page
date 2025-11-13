import { useMemo } from "react";
import { cn } from "../../utils/cn";

interface AvatarProps {
  initials?: string;
  className?: string;
}

const palette = [
  "bg-primary",
  "bg-secondary-800",
  "bg-accent-600",
  "bg-primary/80",
  "bg-secondary-700"
];

export function Avatar({ initials, className }: AvatarProps) {
  const label = useMemo(() => {
    if (!initials) return "US";
    const words = initials.trim().split(" ").filter(Boolean);
    if (words.length === 1) {
      return words[0].slice(0, 2).toUpperCase();
    }
    return (words[0][0] + words[words.length - 1][0]).toUpperCase();
  }, [initials]);

  const color = useMemo(() => {
    if (!initials) return palette[0];
    const charCode = initials.charCodeAt(0);
    return palette[charCode % palette.length];
  }, [initials]);

  return (
    <div
      className={cn(
        "flex h-10 w-10 items-center justify-center rounded-full text-xs font-semibold uppercase text-white shadow-sm",
        color,
        className
      )}
    >
      {label}
    </div>
  );
}




import type { HTMLAttributes } from "react";
import { cn } from "../../lib/utils";

export type BadgeVariant = "default" | "success" | "danger" | "info" | "warning" | "muted";

const variantStyles: Record<BadgeVariant, string> = {
  default: "border-white/15 bg-white/5 text-foreground",
  success: "border-accent/40 bg-accent/10 text-accent",
  danger: "border-red-500/40 bg-red-500/10 text-red-300",
  info: "border-accent-cyan/40 bg-accent-cyan/10 text-accent-cyan",
  warning: "border-accent-amber/40 bg-accent-amber/15 text-accent-amber",
  muted: "border-white/10 bg-white/[0.03] text-muted",
};

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

export function Badge({
  className,
  variant = "default",
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium",
        variantStyles[variant],
        className,
      )}
      {...props}
    />
  );
}

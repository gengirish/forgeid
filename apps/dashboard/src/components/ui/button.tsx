import type { ButtonHTMLAttributes } from "react";
import { forwardRef } from "react";
import { cn } from "../../lib/utils";

export type ButtonVariant = "primary" | "secondary" | "danger" | "ghost";

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    "bg-accent text-[#05080e] hover:bg-accent/90 focus-visible:ring-accent/40 shadow-[0_0_24px_-8px_rgba(0,255,178,0.55)]",
  secondary:
    "border border-white/15 bg-white/5 text-foreground hover:bg-white/10 focus-visible:ring-white/20",
  danger:
    "bg-red-600/90 text-white hover:bg-red-600 focus-visible:ring-red-500/40",
  ghost: "text-muted hover:bg-white/5 hover:text-foreground focus-visible:ring-white/15",
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button({ className, variant = "primary", type = "button", ...props }, ref) {
    return (
      <button
        ref={ref}
        type={type}
        className={cn(
          "inline-flex items-center justify-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50",
          variantStyles[variant],
          className,
        )}
        {...props}
      />
    );
  },
);

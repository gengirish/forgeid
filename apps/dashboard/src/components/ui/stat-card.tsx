import type { LucideIcon } from "lucide-react";
import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "../../lib/utils";
import { Card, CardContent } from "./card";

export interface StatCardProps extends HTMLAttributes<HTMLDivElement> {
  icon: LucideIcon;
  label: string;
  value: string | number;
  trend?: ReactNode;
}

export function StatCard({
  icon: Icon,
  label,
  value,
  trend,
  className,
  ...props
}: StatCardProps) {
  return (
    <Card className={cn("overflow-hidden", className)} {...props}>
      <CardContent className="flex items-start gap-4 p-5">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-accent/25 bg-accent/10 text-accent">
          <Icon className="h-5 w-5" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium uppercase tracking-wide text-muted">
            {label}
          </p>
          <p className="font-heading mt-1 text-2xl font-semibold tabular-nums tracking-tight text-foreground">
            {value}
          </p>
          {trend != null ? (
            <div className="mt-2 text-xs text-muted">{trend}</div>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}

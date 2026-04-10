"use client";

import {
  Bot,
  KeyRound,
  LayoutDashboard,
  ScrollText,
  Settings,
  Shield,
  Webhook,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "../lib/utils";

const nav = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/agents", label: "Agents", icon: Bot },
  { href: "/api-keys", label: "API Keys", icon: KeyRound },
  { href: "/roles", label: "Roles", icon: Shield },
  { href: "/audit", label: "Audit Log", icon: ScrollText },
  { href: "/webhooks", label: "Webhooks", icon: Webhook },
  { href: "/settings", label: "Settings", icon: Settings },
] as const;

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-full w-64 shrink-0 flex-col border-r border-white/10 bg-surface/90 backdrop-blur-md">
      <div className="flex h-16 items-center gap-2 border-b border-white/10 px-5">
        <span
          className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent/15 text-xs font-bold tracking-tight text-accent ring-1 ring-accent/30"
          aria-hidden
        >
          FID
        </span>
        <span className="font-heading text-lg font-semibold tracking-tight text-foreground">
          ForgeID
        </span>
      </div>
      <nav className="flex flex-1 flex-col gap-0.5 p-3" aria-label="Main">
        {nav.map(({ href, label, icon: Icon }) => {
          const active =
            href === "/"
              ? pathname === "/"
              : pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-accent/10 text-accent shadow-[inset_0_0_0_1px_rgba(0,255,178,0.2)]"
                  : "text-muted hover:bg-white/5 hover:text-foreground",
              )}
            >
              <Icon className="h-4 w-4 shrink-0 opacity-90" aria-hidden />
              {label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-white/10 p-3">
        <div className="rounded-lg border border-white/10 bg-background/60 px-3 py-2.5">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted">
            Organization
          </p>
          <p className="mt-0.5 truncate text-sm font-medium text-foreground">
            Acme AI Labs
          </p>
          <p className="truncate text-xs text-muted">org_acme_production</p>
        </div>
      </div>
    </aside>
  );
}

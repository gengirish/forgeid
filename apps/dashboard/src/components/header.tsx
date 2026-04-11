"use client";

import { Bell, ChevronDown, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { cn } from "../lib/utils";
import { Button } from "./ui/button";

function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0]![0]! + parts[1]![0]!).toUpperCase();
  }
  if (parts.length === 1 && parts[0]!.length >= 2) {
    return parts[0]!.slice(0, 2).toUpperCase();
  }
  if (parts.length === 1) {
    return parts[0]!.slice(0, 1).toUpperCase();
  }
  return "?";
}

export function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  const initials = useMemo(
    () => (user?.name ? initialsFromName(user.name) : "?"),
    [user?.name],
  );

  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-4 border-b border-white/10 bg-background/80 px-4 backdrop-blur-md lg:px-6">
      <div className="relative min-w-0 flex-1 max-w-xl">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
          aria-hidden
        />
        <input
          type="search"
          placeholder="Search agents, keys, events…"
          className={cn(
            "h-10 w-full rounded-lg border border-white/10 bg-surface/80 py-2 pl-10 pr-4 text-sm text-foreground placeholder:text-muted",
            "outline-none transition-colors focus:border-accent/40 focus:ring-2 focus:ring-accent/20",
          )}
          aria-label="Search"
        />
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <Button
          type="button"
          variant="ghost"
          className="relative h-10 w-10 rounded-lg p-0"
          aria-label="Notifications"
        >
          <Bell className="h-5 w-5" />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-accent shadow-[0_0_8px_rgba(0,255,178,0.6)]" />
        </Button>
        <div className="relative">
          <Button
            type="button"
            variant="secondary"
            className="h-10 gap-2 rounded-lg px-2 sm:px-3"
            onClick={() => setMenuOpen((o) => !o)}
            aria-expanded={menuOpen}
            aria-haspopup="menu"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-md bg-accent/15 text-xs font-semibold text-accent">
              {initials}
            </span>
            <span className="hidden text-left text-sm sm:block">
              <span className="block font-medium text-foreground">{user?.name ?? "—"}</span>
              <span className="block text-xs text-muted">{user?.email ?? ""}</span>
            </span>
            <ChevronDown className="hidden h-4 w-4 text-muted sm:block" />
          </Button>
          {menuOpen ? (
            <div
              role="menu"
              className="absolute right-0 mt-2 w-48 rounded-lg border border-white/10 bg-surface py-1 shadow-xl"
            >
              <button
                type="button"
                role="menuitem"
                className="block w-full px-3 py-2 text-left text-sm text-foreground hover:bg-white/5"
                onClick={() => setMenuOpen(false)}
              >
                Profile
              </button>
              <button
                type="button"
                role="menuitem"
                className="block w-full px-3 py-2 text-left text-sm text-foreground hover:bg-white/5"
                onClick={() => {
                  setMenuOpen(false);
                  logout();
                }}
              >
                Sign out
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}

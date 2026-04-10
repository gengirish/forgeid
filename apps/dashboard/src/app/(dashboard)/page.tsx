import {
  ArrowRight,
  Ban,
  Bot,
  KeyRound,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { Badge } from "../../components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { StatCard } from "../../components/ui/stat-card";
import {
  mockAgents,
  mockAuditEvents,
  mockStats,
} from "../../lib/mock-data";
import { cn } from "../../lib/utils";

function formatInt(n: number) {
  return new Intl.NumberFormat("en-US", { notation: "compact" }).format(n);
}

function formatTime(iso: string) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(iso));
}

export default function DashboardHomePage() {
  const activeAgents = mockAgents.filter((a) => a.status === "active");
  const recent = mockAuditEvents.slice(0, 5);

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-8">
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
          Overview
        </h1>
        <p className="mt-1 text-sm text-muted">
          Real-time identity signals across agents, keys, and policy.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={ShieldCheck}
          label="Active sessions"
          value={formatInt(mockStats.activeSessions)}
          trend={<span className="text-accent">+4.2%</span>}
        />
        <StatCard
          icon={Sparkles}
          label="Agent tokens (24h)"
          value={formatInt(mockStats.agentTokens24h)}
          trend={<span className="text-muted">Within plan</span>}
        />
        <StatCard
          icon={Bot}
          label="Permission checks"
          value={formatInt(mockStats.permissionChecks)}
          trend={<span className="text-accent-cyan">p99 6ms</span>}
        />
        <StatCard
          icon={Ban}
          label="Denied actions"
          value={formatInt(mockStats.deniedActions)}
          trend={<span className="text-accent-amber">Review policies</span>}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div>
              <CardTitle>Recent activity</CardTitle>
              <p className="text-sm text-muted">Latest audit events</p>
            </div>
            <Link
              href="/audit"
              className="inline-flex h-9 items-center gap-1 text-sm font-medium text-accent hover:text-accent/90"
            >
              View all
              <ArrowRight className="h-4 w-4" />
            </Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {recent.map((e) => (
              <div
                key={e.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-white/5 bg-background/40 px-3 py-2.5"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">
                    {e.type}
                  </p>
                  <p className="truncate text-xs text-muted">
                    {e.actor} → {e.resource}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge
                    variant={
                      e.outcome === "allowed"
                        ? "success"
                        : e.outcome === "denied"
                          ? "danger"
                          : "info"
                    }
                  >
                    {e.outcome}
                  </Badge>
                  <span className="text-xs tabular-nums text-muted">
                    {formatTime(e.timestamp)}
                  </span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Quick actions</CardTitle>
            <p className="text-sm text-muted">Common control-plane tasks</p>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <Link
              href="/api-keys"
              className={cn(
                "inline-flex items-center justify-center gap-2 rounded-lg px-3.5 py-2.5 text-sm font-medium transition-colors",
                "bg-accent text-[#05080e] hover:bg-accent/90",
                "shadow-[0_0_24px_-8px_rgba(0,255,178,0.55)]",
              )}
            >
              <KeyRound className="h-4 w-4" />
              Create API key
            </Link>
            <Link
              href="/agents"
              className={cn(
                "inline-flex items-center justify-center gap-2 rounded-lg border border-white/15 bg-white/5 px-3.5 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-white/10",
              )}
            >
              <Bot className="h-4 w-4" />
              Spawn agent
            </Link>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div>
            <CardTitle>Active agents</CardTitle>
            <p className="text-sm text-muted">
              Short-lived credentials with scoped capabilities
            </p>
          </div>
          <Link
            href="/agents"
            className="inline-flex h-9 items-center gap-1 text-sm font-medium text-accent hover:text-accent/90"
          >
            Manage
            <ArrowRight className="h-4 w-4" />
          </Link>
        </CardHeader>
        <CardContent>
          <ul className="divide-y divide-white/5 rounded-lg border border-white/10">
            {activeAgents.map((a) => (
              <li
                key={a.id}
                className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="font-mono-brand text-sm text-accent-cyan">{a.id}</p>
                  <p className="text-sm text-foreground">{a.purpose}</p>
                  <p className="text-xs text-muted">{a.model}</p>
                </div>
                <div className="flex flex-wrap gap-1">
                  {a.capabilities.map((c) => (
                    <Badge key={c} variant="muted" className="font-mono-brand text-[10px]">
                      {c}
                    </Badge>
                  ))}
                </div>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

"use client";

import {
  ArrowRight,
  Bot,
  KeyRound,
  ScrollText,
  Shield,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Badge } from "../../../components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
import { StatCard } from "../../../components/ui/stat-card";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import { cn } from "../../../lib/utils";

function formatInt(n: number) {
  return new Intl.NumberFormat("en-US", { notation: "compact" }).format(n);
}

function formatRelativeTime(iso: string): string {
  const d = new Date(iso);
  const t = d.getTime();
  if (Number.isNaN(t)) return "—";
  const diffSec = Math.round((Date.now() - t) / 1000);
  const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
  if (Math.abs(diffSec) < 60) return rtf.format(-diffSec, "second");
  const diffMin = Math.round(diffSec / 60);
  if (Math.abs(diffMin) < 60) return rtf.format(-diffMin, "minute");
  const diffHour = Math.round(diffMin / 60);
  if (Math.abs(diffHour) < 24) return rtf.format(-diffHour, "hour");
  const diffDay = Math.round(diffHour / 24);
  if (Math.abs(diffDay) < 30) return rtf.format(-diffDay, "day");
  const diffMonth = Math.round(diffDay / 30);
  return rtf.format(-diffMonth, "month");
}

type AgentRow = {
  id: string;
  status: string;
  purpose: string | null;
  model: string | null;
  capabilities: unknown;
};

type AuditEventRow = {
  id: string;
  event_type: string;
  actor_id: string;
  target_id: string | null;
  created_at: string;
};

export default function DashboardHomePage() {
  const { token } = useAuth();
  const [dataLoading, setDataLoading] = useState(true);
  const [agents, setAgents] = useState<AgentRow[]>([]);
  const [apiKeyCount, setApiKeyCount] = useState(0);
  const [roleCount, setRoleCount] = useState(0);
  const [auditEvents, setAuditEvents] = useState<AuditEventRow[]>([]);
  const [auditHasMore, setAuditHasMore] = useState(false);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    setDataLoading(true);
    (async () => {
      try {
        const [agentsRes, keysRes, rolesRes, auditRes] = await Promise.all([
          api.listAgents(token),
          api.listApiKeys(token),
          api.listRoles(token),
          api.queryAudit(token, { limit: "100" }),
        ]);
        if (cancelled) return;
        setAgents((agentsRes.agents ?? []) as AgentRow[]);
        setApiKeyCount(keysRes.api_keys?.length ?? 0);
        setRoleCount(rolesRes.roles?.length ?? 0);
        setAuditEvents((auditRes.events ?? []) as AuditEventRow[]);
        setAuditHasMore(auditRes.has_more ?? false);
      } catch {
        if (!cancelled) {
          setAgents([]);
          setApiKeyCount(0);
          setRoleCount(0);
          setAuditEvents([]);
          setAuditHasMore(false);
        }
      } finally {
        if (!cancelled) setDataLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const activeAgents = agents.filter((a) => a.status === "active");
  const activeAgentCount = activeAgents.length;
  const recent = auditEvents.slice(0, 5);
  const recentEventsValue =
    auditHasMore && auditEvents.length >= 100
      ? `${formatInt(100)}+`
      : formatInt(auditEvents.length);

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
        {dataLoading ? (
          <>
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className="overflow-hidden rounded-xl border border-white/10 bg-card/40 p-5"
              >
                <div className="flex items-start gap-4">
                  <div className="h-11 w-11 shrink-0 animate-pulse rounded-lg bg-white/5" />
                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="h-3 w-24 animate-pulse rounded bg-white/5" />
                    <div className="h-8 w-16 animate-pulse rounded bg-white/5" />
                    <div className="h-3 w-32 animate-pulse rounded bg-white/5" />
                  </div>
                </div>
              </div>
            ))}
          </>
        ) : (
          <>
            <StatCard
              icon={Bot}
              label="Active Agents"
              value={formatInt(activeAgentCount)}
              trend={<span className="text-muted">Spawned &amp; active</span>}
            />
            <StatCard
              icon={KeyRound}
              label="API Keys"
              value={formatInt(apiKeyCount)}
              trend={<span className="text-muted">In this org</span>}
            />
            <StatCard
              icon={Shield}
              label="Roles"
              value={formatInt(roleCount)}
              trend={<span className="text-muted">Defined roles</span>}
            />
            <StatCard
              icon={ScrollText}
              label="Recent Events"
              value={recentEventsValue}
              trend={
                auditHasMore ? (
                  <span className="text-muted">More in audit log</span>
                ) : (
                  <span className="text-muted">Latest batch</span>
                )
              }
            />
          </>
        )}
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
            {dataLoading ? (
              <>
                {[0, 1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-white/5 bg-background/40 px-3 py-2.5"
                  >
                    <div className="min-w-0 flex-1 space-y-2">
                      <div className="h-4 w-40 max-w-full animate-pulse rounded bg-white/5" />
                      <div className="h-3 w-56 max-w-full animate-pulse rounded bg-white/5" />
                    </div>
                    <div className="h-3 w-20 animate-pulse rounded bg-white/5" />
                  </div>
                ))}
              </>
            ) : recent.length === 0 ? (
              <p className="rounded-lg border border-white/5 bg-background/40 px-3 py-6 text-center text-sm text-muted">
                No audit events yet.
              </p>
            ) : (
              recent.map((e) => (
                <div
                  key={e.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-white/5 bg-background/40 px-3 py-2.5"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">{e.event_type}</p>
                    <p className="truncate text-xs text-muted">
                      {e.actor_id} → {e.target_id ?? "—"}
                    </p>
                  </div>
                  <span className="text-xs tabular-nums text-muted">
                    {formatRelativeTime(e.created_at)}
                  </span>
                </div>
              ))
            )}
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
          {dataLoading ? (
            <ul className="divide-y divide-white/5 rounded-lg border border-white/10">
              {[0, 1, 2].map((i) => (
                <li key={i} className="space-y-2 px-4 py-3">
                  <div className="h-4 w-48 max-w-full animate-pulse rounded bg-white/5" />
                  <div className="h-4 w-64 max-w-full animate-pulse rounded bg-white/5" />
                  <div className="h-3 w-32 animate-pulse rounded bg-white/5" />
                  <div className="flex flex-wrap gap-1 pt-1">
                    <div className="h-5 w-16 animate-pulse rounded-md bg-white/5" />
                    <div className="h-5 w-20 animate-pulse rounded-md bg-white/5" />
                  </div>
                </li>
              ))}
            </ul>
          ) : activeAgents.length === 0 ? (
            <p className="rounded-lg border border-white/10 px-4 py-8 text-center text-sm text-muted">
              No active agents. Spawn one from Agents or use Quick actions.
            </p>
          ) : (
            <ul className="divide-y divide-white/5 rounded-lg border border-white/10">
              {activeAgents.map((a) => {
                const caps = Array.isArray(a.capabilities) ? a.capabilities : [];
                return (
                  <li
                    key={a.id}
                    className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
                  >
                    <div className="min-w-0">
                      <p className="font-mono-brand text-sm text-accent-cyan">{a.id}</p>
                      <p className="text-sm text-foreground">{a.purpose ?? "—"}</p>
                      <p className="text-xs text-muted">{a.model ?? "—"}</p>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {caps.map((c) => (
                        <Badge
                          key={String(c)}
                          variant="muted"
                          className="font-mono-brand text-[10px]"
                        >
                          {String(c)}
                        </Badge>
                      ))}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

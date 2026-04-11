"use client";

import { ChevronDown, ChevronRight } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { api, ApiError } from "../lib/api";
import { useAuth } from "../lib/auth-context";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";

const AUDIT_EVENT_TYPES = [
  "token.issued",
  "token.revoked",
  "token.refreshed",
  "token.verified",
  "token.agent.spawned",
  "token.agent.terminated",
  "apikey.created",
  "apikey.revoked",
  "apikey.updated",
  "webhook.created",
  "webhook.deleted",
  "role.created",
  "org.updated",
  "org.member.invited",
  "org.member.removed",
  "user.updated",
  "session.created",
  "authz.check.allowed",
  "authz.check.denied",
] as const;

function formatRelative(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const s = Math.floor(ms / 1000);
  if (s < 60) return `${Math.max(0, s)}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

function eventTypeBadgeVariant(
  eventType: string,
): "success" | "danger" | "info" | "warning" | "muted" | "default" {
  if (eventType.startsWith("token.")) return "info";
  if (eventType.startsWith("apikey.")) return "warning";
  if (eventType.startsWith("webhook.")) return "success";
  if (eventType.startsWith("authz.")) return eventType.includes("denied") ? "danger" : "success";
  if (eventType.startsWith("org.") || eventType.startsWith("user.")) return "default";
  return "muted";
}

function AuditRowSkeleton() {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        <div className="flex animate-pulse items-center gap-3 px-4 py-3">
          <div className="h-4 w-4 rounded bg-white/10" />
          <div className="h-5 w-24 rounded-md bg-white/10" />
          <div className="h-4 flex-1 rounded bg-white/5" />
          <div className="h-4 w-20 rounded bg-white/10" />
        </div>
      </CardContent>
    </Card>
  );
}

export function AuditLogPanel() {
  const { token, loading: authLoading } = useAuth();
  const [events, setEvents] = useState<any[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [eventTypeFilter, setEventTypeFilter] = useState<string>("");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const fetchFirstPage = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.queryAudit(token, {
        limit: "50",
        ...(eventTypeFilter ? { event_type: eventTypeFilter } : {}),
      });
      setEvents(res.events);
      setCursor(res.cursor);
      setHasMore(res.has_more);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Failed to load audit log");
      setEvents([]);
      setCursor(null);
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  }, [token, eventTypeFilter]);

  useEffect(() => {
    if (authLoading || !token) {
      if (!authLoading && !token) {
        setLoading(false);
        setEvents([]);
      }
      return;
    }
    void fetchFirstPage();
  }, [authLoading, token, eventTypeFilter, fetchFirstPage]);

  function toggle(id: string) {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  async function loadMore() {
    if (!token || !cursor || !hasMore || loadingMore) return;
    setLoadingMore(true);
    setError(null);
    try {
      const res = await api.queryAudit(token, {
        limit: "50",
        cursor,
        ...(eventTypeFilter ? { event_type: eventTypeFilter } : {}),
      });
      setEvents((prev) => [...prev, ...res.events]);
      setCursor(res.cursor);
      setHasMore(res.has_more);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Failed to load more");
    } finally {
      setLoadingMore(false);
    }
  }

  if (!authLoading && !token) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight text-foreground">
            Audit log
          </h1>
          <p className="mt-1 text-sm text-muted">Sign in to view the audit trail.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight text-foreground">
            Audit log
          </h1>
          <p className="mt-1 text-sm text-muted">
            Immutable trail of authentication and authorization decisions.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:items-end">
          <label htmlFor="audit-event-type" className="text-xs font-medium text-muted">
            Event type
          </label>
          <select
            id="audit-event-type"
            value={eventTypeFilter}
            onChange={(e) => setEventTypeFilter(e.target.value)}
            className="h-9 min-w-[12rem] rounded-lg border border-white/10 bg-surface px-3 text-sm text-foreground outline-none focus:border-accent-cyan/40 focus:ring-2 focus:ring-accent-cyan/20"
          >
            <option value="">All events</option>
            {AUDIT_EVENT_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant={eventTypeFilter === "" ? "primary" : "secondary"}
          className="h-8 px-3 text-xs"
          onClick={() => setEventTypeFilter("")}
        >
          All
        </Button>
        {AUDIT_EVENT_TYPES.slice(0, 8).map((t) => (
          <Button
            key={t}
            type="button"
            variant={eventTypeFilter === t ? "primary" : "secondary"}
            className="h-8 px-2 font-mono-brand text-[10px]"
            onClick={() => setEventTypeFilter(t)}
          >
            {t}
          </Button>
        ))}
      </div>

      {error ? (
        <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
          {error}
        </p>
      ) : null}

      <div className="space-y-2">
        {authLoading || (loading && events.length === 0)
          ? Array.from({ length: 5 }).map((_, i) => <AuditRowSkeleton key={i} />)
          : events.map((e, idx) => {
              const id = e.id != null ? String(e.id) : `audit-row-${idx}`;
              const open = expanded[id];
              const eventType = e.event_type ?? e.type ?? "unknown";
              const actorId = e.actor_id ?? "—";
              const targetType = e.target_type ?? "—";
              const targetId = e.target_id ?? "—";
              const createdAt = e.created_at ?? e.timestamp ?? new Date().toISOString();
              const meta = e.metadata ?? {};
              return (
                <Card key={id} className="overflow-hidden">
                  <CardContent className="p-0">
                    <button
                      type="button"
                      className="flex w-full flex-col gap-2 px-4 py-3 text-left transition-colors hover:bg-white/[0.03] sm:flex-row sm:flex-wrap sm:items-center sm:gap-3"
                      onClick={() => toggle(id)}
                      aria-expanded={open}
                    >
                      <div className="flex w-full items-center gap-3 sm:w-auto sm:min-w-0 sm:flex-1">
                        {open ? (
                          <ChevronDown className="h-4 w-4 shrink-0 text-muted" />
                        ) : (
                          <ChevronRight className="h-4 w-4 shrink-0 text-muted" />
                        )}
                        <Badge variant={eventTypeBadgeVariant(eventType)} className="max-w-[min(100%,14rem)] truncate font-mono-brand text-[10px]">
                          {eventType}
                        </Badge>
                        <time
                          className="ml-auto shrink-0 text-xs tabular-nums text-muted sm:ml-0 sm:order-last sm:ml-auto"
                          dateTime={createdAt}
                          title={new Date(createdAt).toLocaleString()}
                        >
                          {formatRelative(createdAt)}
                        </time>
                      </div>
                      <div className="flex w-full flex-wrap gap-x-3 gap-y-1 pl-7 text-xs sm:pl-0">
                        <span className="font-mono-brand text-muted">
                          actor: <span className="text-foreground">{actorId}</span>
                        </span>
                        <span className="text-muted">
                          <span className="text-muted/80">target</span>{" "}
                          <span className="font-mono-brand text-foreground">{targetType}</span>
                          <span className="text-muted"> · </span>
                          <span className="font-mono-brand text-foreground">{targetId}</span>
                        </span>
                      </div>
                    </button>
                    {open ? (
                      <div className="border-t border-white/10 bg-background/50 px-4 py-3">
                        <p className="text-xs font-medium uppercase tracking-wide text-muted">
                          Metadata
                        </p>
                        <pre className="font-mono-brand mt-2 max-h-48 overflow-auto rounded-lg border border-white/10 bg-black/30 p-3 text-xs text-foreground">
                          {JSON.stringify(meta, null, 2)}
                        </pre>
                      </div>
                    ) : null}
                  </CardContent>
                </Card>
              );
            })}
      </div>

      {!loading && events.length === 0 && !error ? (
        <p className="text-center text-sm text-muted">No events yet.</p>
      ) : null}

      {hasMore ? (
        <div className="flex justify-center">
          <Button
            type="button"
            variant="secondary"
            disabled={loadingMore || loading}
            onClick={() => void loadMore()}
          >
            {loadingMore ? "Loading…" : "Load more"}
          </Button>
        </div>
      ) : null}
    </div>
  );
}

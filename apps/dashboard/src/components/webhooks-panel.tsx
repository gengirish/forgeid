"use client";

import { Check, ChevronDown, ChevronRight, Copy, Radio, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { api, ApiError } from "../lib/api";
import { useAuth } from "../lib/auth-context";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";

const WEBHOOK_EVENT_OPTIONS = [
  "token.issued",
  "token.revoked",
  "token.agent.spawned",
  "token.agent.terminated",
  "apikey.created",
  "apikey.revoked",
  "webhook.created",
  "webhook.deleted",
  "role.created",
  "org.updated",
] as const;

function deliveryBadgeVariant(status: string): "success" | "danger" | "warning" | "muted" {
  const s = status?.toLowerCase() ?? "";
  if (s === "success" || s === "delivered") return "success";
  if (s === "failed" || s === "dead") return "danger";
  if (s === "pending" || s === "retrying") return "warning";
  return "muted";
}

function formatTimestamp(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "short",
    timeStyle: "medium",
  }).format(new Date(iso));
}

export function WebhooksPanel() {
  const { token, loading: authLoading } = useAuth();
  const [webhooks, setWebhooks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [showForm, setShowForm] = useState(false);
  const [url, setUrl] = useState("");
  const [selectedEvents, setSelectedEvents] = useState<Set<string>>(
    () => new Set(["token.issued", "token.revoked"]),
  );
  const [eventsComma, setEventsComma] = useState("");
  const [lastSecret, setLastSecret] = useState<{ id: string; secret: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [deliveriesById, setDeliveriesById] = useState<Record<string, any[]>>({});
  const [deliveriesLoading, setDeliveriesLoading] = useState<Record<string, boolean>>({});
  const [deliveriesError, setDeliveriesError] = useState<Record<string, string | undefined>>({});
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const refreshList = useCallback(async () => {
    if (!token) return;
    setError(null);
    try {
      const res = await api.listWebhooks(token);
      setWebhooks(res.webhooks ?? []);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Failed to load webhooks");
      setWebhooks([]);
    }
  }, [token]);

  useEffect(() => {
    if (authLoading) return;
    if (!token) {
      setLoading(false);
      setWebhooks([]);
      return;
    }
    setLoading(true);
    void refreshList().finally(() => setLoading(false));
  }, [authLoading, token, refreshList]);

  function toggleEvent(opt: string) {
    setSelectedEvents((prev) => {
      const next = new Set(prev);
      if (next.has(opt)) next.delete(opt);
      else next.add(opt);
      return next;
    });
  }

  function parseEventsFromInputs(): string[] {
    const fromComma = eventsComma
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const fromSelect = [...selectedEvents];
    const merged = [...new Set([...fromSelect, ...fromComma])];
    return merged.length ? merged : ["token.issued"];
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    const events = parseEventsFromInputs();
    setSubmitting(true);
    setError(null);
    try {
      const res = await api.createWebhook(token, {
        url: url.trim() || "https://example.com/hook",
        events,
      });
      const wh = res.webhook;
      if (wh?.secret) {
        setLastSecret({ id: wh.id, secret: wh.secret });
        setCopied(false);
      }
      setUrl("");
      setEventsComma("");
      setShowForm(false);
      await refreshList();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to create webhook");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    if (!token) return;
    setDeletingId(id);
    setError(null);
    try {
      await api.deleteWebhook(token, id);
      setDeliveriesById((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
      await refreshList();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to delete webhook");
    } finally {
      setDeletingId(null);
    }
  }

  async function ensureDeliveries(webhookId: string) {
    if (!token) return;
    if (deliveriesById[webhookId] !== undefined) return;
    setDeliveriesLoading((p) => ({ ...p, [webhookId]: true }));
    setDeliveriesError((p) => ({ ...p, [webhookId]: undefined }));
    try {
      const res = await api.getDeliveries(token, webhookId);
      setDeliveriesById((p) => ({ ...p, [webhookId]: res.deliveries ?? [] }));
    } catch (err) {
      setDeliveriesError((p) => ({
        ...p,
        [webhookId]: err instanceof ApiError ? err.message : "Failed to load deliveries",
      }));
      setDeliveriesById((p) => ({ ...p, [webhookId]: [] }));
    } finally {
      setDeliveriesLoading((p) => ({ ...p, [webhookId]: false }));
    }
  }

  async function toggleExpand(id: string) {
    const next = !expanded[id];
    setExpanded((prev) => ({ ...prev, [id]: next }));
    if (next) await ensureDeliveries(id);
  }

  async function copySecret(secret: string) {
    try {
      await navigator.clipboard.writeText(secret);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  if (!authLoading && !token) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight text-foreground">
            Webhooks
          </h1>
          <p className="mt-1 text-sm text-muted">Sign in to manage webhooks.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight text-foreground">
            Webhooks
          </h1>
          <p className="mt-1 text-sm text-muted">
            Event fan-out with signed deliveries and retries.
          </p>
        </div>
        <Button type="button" variant="primary" onClick={() => setShowForm((s) => !s)}>
          {showForm ? "Close form" : "Create webhook"}
        </Button>
      </div>

      {lastSecret ? (
        <div
          role="alert"
          className="rounded-lg border border-accent-amber/40 bg-accent-amber/10 px-4 py-3 text-sm text-foreground"
        >
          <p className="font-medium text-accent-amber">Webhook signing secret (copy now — shown once)</p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <code className="font-mono-brand flex-1 break-all rounded border border-white/10 bg-black/30 px-2 py-1 text-xs">
              {lastSecret.secret}
            </code>
            <Button
              type="button"
              variant="secondary"
              className="gap-1"
              onClick={() => void copySecret(lastSecret.secret)}
            >
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copied ? "Copied" : "Copy"}
            </Button>
            <Button type="button" variant="secondary" onClick={() => setLastSecret(null)}>
              Dismiss
            </Button>
          </div>
        </div>
      ) : null}

      {error ? (
        <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
          {error}
        </p>
      ) : null}

      {showForm ? (
        <Card className="border-accent-cyan/20">
          <CardHeader>
            <CardTitle>New endpoint</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={(e) => void handleCreate(e)} className="flex max-w-2xl flex-col gap-4">
              <div>
                <label htmlFor="wh-url" className="text-xs font-medium text-muted">
                  URL
                </label>
                <input
                  id="wh-url"
                  value={url}
                  onChange={(ev) => setUrl(ev.target.value)}
                  required
                  className="mt-1 h-10 w-full rounded-lg border border-white/10 bg-background px-3 text-sm text-foreground outline-none focus:border-accent-cyan/40 focus:ring-2 focus:ring-accent-cyan/20"
                  placeholder="https://"
                />
              </div>
              <div>
                <p className="text-xs font-medium text-muted">Events</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {WEBHOOK_EVENT_OPTIONS.map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => toggleEvent(opt)}
                      className={`rounded-md border px-2 py-1 font-mono-brand text-[10px] transition-colors ${
                        selectedEvents.has(opt)
                          ? "border-accent-cyan/50 bg-accent-cyan/15 text-accent-cyan"
                          : "border-white/10 bg-white/[0.03] text-muted hover:border-white/20"
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label htmlFor="wh-events" className="text-xs font-medium text-muted">
                  Additional events (comma-separated)
                </label>
                <input
                  id="wh-events"
                  value={eventsComma}
                  onChange={(ev) => setEventsComma(ev.target.value)}
                  className="mt-1 h-10 w-full rounded-lg border border-white/10 bg-background px-3 font-mono-brand text-sm text-foreground outline-none focus:border-accent-cyan/40 focus:ring-2 focus:ring-accent-cyan/20"
                  placeholder="custom.event, other.event"
                />
              </div>
              <Button type="submit" variant="secondary" className="w-fit" disabled={submitting}>
                {submitting ? "Saving…" : "Save endpoint"}
              </Button>
            </form>
          </CardContent>
        </Card>
      ) : null}

      <div className="space-y-3">
        {loading && webhooks.length === 0 ? (
          <Card>
            <CardContent className="animate-pulse space-y-3 p-4">
              <div className="h-4 w-1/3 rounded bg-white/10" />
              <div className="h-4 w-full rounded bg-white/5" />
            </CardContent>
          </Card>
        ) : null}
        {webhooks.map((w) => {
          const id = w.id;
          const open = expanded[id];
          const deliveries = deliveriesById[id];
          const dLoading = deliveriesLoading[id];
          const dErr = deliveriesError[id];
          return (
            <Card key={id} className="overflow-hidden">
              <CardContent className="p-0">
                <div className="flex flex-wrap items-center gap-3 border-b border-white/5 px-4 py-3">
                  <button
                    type="button"
                    className="flex min-w-0 flex-1 items-center gap-2 text-left text-sm font-medium text-foreground hover:text-accent"
                    onClick={() => void toggleExpand(id)}
                    aria-expanded={open}
                  >
                    {open ? (
                      <ChevronDown className="h-4 w-4 shrink-0 text-muted" />
                    ) : (
                      <ChevronRight className="h-4 w-4 shrink-0 text-muted" />
                    )}
                    <Radio className="h-4 w-4 shrink-0 text-accent-cyan" />
                    <span className="font-mono-brand text-xs text-accent-cyan">{id}</span>
                  </button>
                  <Badge variant={w.active ? "success" : "muted"}>
                    {w.active ? "active" : "inactive"}
                  </Badge>
                  <span className="min-w-0 flex-[2] truncate text-sm text-muted">{w.url}</span>
                  <Button
                    type="button"
                    variant="secondary"
                    className="h-8 gap-1 px-2 text-red-300 hover:bg-red-500/10"
                    disabled={deletingId === id}
                    onClick={() => void handleDelete(id)}
                    aria-label="Delete webhook"
                  >
                    <Trash2 className="h-4 w-4" />
                    {deletingId === id ? "…" : "Delete"}
                  </Button>
                </div>
                <div className="flex flex-wrap gap-1 border-b border-white/5 px-4 py-2">
                  {(w.events ?? []).map((ev: string) => (
                    <Badge key={ev} variant="info" className="font-mono-brand text-[10px]">
                      {ev}
                    </Badge>
                  ))}
                </div>
                <div className="flex flex-wrap gap-4 px-4 py-2 text-xs text-muted">
                  <span>
                    Created{" "}
                    <time dateTime={w.created_at}>{formatTimestamp(w.created_at)}</time>
                  </span>
                </div>
                {open ? (
                  <div className="p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                      Delivery log
                    </p>
                    {dErr ? (
                      <p className="mt-2 text-sm text-red-300">{dErr}</p>
                    ) : null}
                    {dLoading && deliveries === undefined ? (
                      <p className="mt-3 text-sm text-muted">Loading deliveries…</p>
                    ) : null}
                    {!dLoading || deliveries !== undefined ? (
                      <div className="mt-3">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Delivery</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead>Attempts</TableHead>
                              <TableHead>HTTP</TableHead>
                              <TableHead>Last attempt</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {(deliveries ?? []).length === 0 && !dLoading ? (
                              <TableRow>
                                <TableCell colSpan={5} className="text-muted">
                                  No deliveries yet.
                                </TableCell>
                              </TableRow>
                            ) : null}
                            {(deliveries ?? []).map((d) => (
                              <TableRow key={d.id}>
                                <TableCell className="font-mono-brand text-xs text-muted">
                                  {d.id}
                                </TableCell>
                                <TableCell>
                                  <Badge variant={deliveryBadgeVariant(d.status)}>{d.status}</Badge>
                                </TableCell>
                                <TableCell className="tabular-nums text-muted">
                                  {d.attempts ?? "—"}
                                </TableCell>
                                <TableCell className="tabular-nums text-muted">
                                  {d.response_status ?? "—"}
                                </TableCell>
                                <TableCell className="text-xs text-muted">
                                  {formatTimestamp(d.last_attempt_at ?? d.created_at)}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {!loading && webhooks.length === 0 && !error ? (
        <p className="text-center text-sm text-muted">No webhooks configured.</p>
      ) : null}
    </div>
  );
}

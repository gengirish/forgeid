"use client";

import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { Bot, ChevronDown, ChevronRight, Copy, Plus } from "lucide-react";
import Link from "next/link";
import { Fragment, useCallback, useEffect, useState } from "react";
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

function formatTime(iso: string | null | undefined) {
  if (!iso) return "—";
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(iso));
}

function statusBadgeVariant(
  status: string,
): "success" | "danger" | "warning" | "muted" {
  const s = status.toLowerCase();
  if (s === "active") return "success";
  if (s === "terminated") return "danger";
  if (s === "expired") return "warning";
  return "muted";
}

type AgentRow = Record<string, unknown> & {
  id: string;
  status?: string;
  purpose?: string | null;
  model?: string | null;
  capabilities?: string[];
};

export function AgentsTable() {
  const { token, loading: authLoading } = useAuth();
  const [agents, setAgents] = useState<AgentRow[]>([]);
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);

  const [spawnOpen, setSpawnOpen] = useState(false);
  const [spawnSubmitting, setSpawnSubmitting] = useState(false);
  const [spawnError, setSpawnError] = useState<string | null>(null);
  const [capInput, setCapInput] = useState("");
  const [maxToolCalls, setMaxToolCalls] = useState(50);
  const [maxLifetime, setMaxLifetime] = useState(60);
  const [purpose, setPurpose] = useState("");
  const [model, setModel] = useState("");

  const [tokenModal, setTokenModal] = useState<{ access_token: string; agent_id: string } | null>(
    null,
  );

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [chainById, setChainById] = useState<Record<string, unknown[]>>({});
  const [chainLoadingId, setChainLoadingId] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!token) return;
    setListError(null);
    setListLoading(true);
    try {
      const res = await api.listAgents(token);
      setAgents((res.agents ?? []) as AgentRow[]);
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : "Failed to load agents";
      setListError(msg);
      setAgents([]);
    } finally {
      setListLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (authLoading || !token) return;
    void refresh();
  }, [authLoading, token, refresh]);

  async function toggleChain(id: string) {
    if (!token) return;
    if (expandedId === id) {
      setExpandedId(null);
      return;
    }
    setExpandedId(id);
    if (chainById[id]) return;
    setChainLoadingId(id);
    try {
      const res = await api.getAgentChain(token, id);
      setChainById((prev) => ({ ...prev, [id]: res.delegation_chain ?? [] }));
    } catch {
      setChainById((prev) => ({ ...prev, [id]: [] }));
    } finally {
      setChainLoadingId(null);
    }
  }

  async function onSpawn(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    const capabilities = capInput
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    if (capabilities.length === 0) {
      setSpawnError("Add at least one capability (comma-separated).");
      return;
    }
    setSpawnError(null);
    setSpawnSubmitting(true);
    try {
      const res = await api.spawnAgent(token, {
        capabilities,
        max_tool_calls: maxToolCalls,
        max_lifetime_minutes: maxLifetime,
        purpose: purpose.trim() || undefined,
        model: model.trim() || undefined,
      });
      setSpawnOpen(false);
      setCapInput("");
      setPurpose("");
      setModel("");
      setMaxToolCalls(50);
      setMaxLifetime(60);
      setTokenModal({ access_token: res.access_token, agent_id: res.agent_id });
      await refresh();
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Failed to spawn agent";
      setSpawnError(msg);
    } finally {
      setSpawnSubmitting(false);
    }
  }

  async function onTerminate(id: string) {
    if (!token) return;
    setListError(null);
    try {
      await api.terminateAgent(token, id);
      await refresh();
      if (expandedId === id) setExpandedId(null);
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : "Failed to terminate";
      setListError(msg);
    }
  }

  function copyText(text: string) {
    void navigator.clipboard.writeText(text);
  }

  if (authLoading || !token) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 animate-pulse rounded-lg bg-white/5" />
        <div className="h-4 w-96 max-w-full animate-pulse rounded bg-white/5" />
        <div className="space-y-2 rounded-xl border border-white/10 bg-surface/80 p-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-10 animate-pulse rounded bg-white/5" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight text-foreground">
            Agents
          </h1>
          <p className="mt-1 text-sm text-muted">
            Ephemeral identities with model-bound capabilities.
          </p>
        </div>
        <Button
          type="button"
          variant="primary"
          className="gap-2"
          onClick={() => {
            setSpawnOpen(true);
            setSpawnError(null);
          }}
        >
          <Plus className="h-4 w-4" />
          Spawn agent
        </Button>
      </div>
      <p className="text-xs text-muted">
        Manage delegated agents for your organization.{" "}
        <Link href="/" className="text-accent hover:underline">
          Back to overview
        </Link>
      </p>

      {listError ? (
        <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
          {listError}
        </p>
      ) : null}

      {spawnOpen ? (
        <Card className="border-accent/25">
          <CardHeader>
            <CardTitle>Spawn agent</CardTitle>
            <p className="text-sm text-muted">
              Creates a short-lived agent token with the limits you set.
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={onSpawn} className="flex flex-col gap-4 sm:max-w-lg">
              {spawnError ? (
                <p className="text-sm text-red-300">{spawnError}</p>
              ) : null}
              <div>
                <label htmlFor="agent-caps" className="text-xs font-medium text-muted">
                  Capabilities (comma-separated)
                </label>
                <input
                  id="agent-caps"
                  value={capInput}
                  onChange={(ev) => setCapInput(ev.target.value)}
                  className="mt-1 h-10 w-full rounded-lg border border-white/10 bg-background px-3 font-mono-brand text-sm text-foreground outline-none focus:border-accent/40 focus:ring-2 focus:ring-accent/20"
                  placeholder="e.g. read, write"
                  required
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="agent-max-tools" className="text-xs font-medium text-muted">
                    Max tool calls
                  </label>
                  <input
                    id="agent-max-tools"
                    type="number"
                    min={0}
                    value={maxToolCalls}
                    onChange={(ev) => setMaxToolCalls(Number(ev.target.value))}
                    className="mt-1 h-10 w-full rounded-lg border border-white/10 bg-background px-3 text-sm text-foreground outline-none focus:border-accent/40 focus:ring-2 focus:ring-accent/20"
                  />
                </div>
                <div>
                  <label htmlFor="agent-max-life" className="text-xs font-medium text-muted">
                    Max lifetime (minutes)
                  </label>
                  <input
                    id="agent-max-life"
                    type="number"
                    min={1}
                    value={maxLifetime}
                    onChange={(ev) => setMaxLifetime(Number(ev.target.value))}
                    className="mt-1 h-10 w-full rounded-lg border border-white/10 bg-background px-3 text-sm text-foreground outline-none focus:border-accent/40 focus:ring-2 focus:ring-accent/20"
                  />
                </div>
              </div>
              <div>
                <label htmlFor="agent-purpose" className="text-xs font-medium text-muted">
                  Purpose (optional)
                </label>
                <input
                  id="agent-purpose"
                  value={purpose}
                  onChange={(ev) => setPurpose(ev.target.value)}
                  className="mt-1 h-10 w-full rounded-lg border border-white/10 bg-background px-3 text-sm text-foreground outline-none focus:border-accent/40 focus:ring-2 focus:ring-accent/20"
                  placeholder="e.g. nightly ETL job"
                />
              </div>
              <div>
                <label htmlFor="agent-model" className="text-xs font-medium text-muted">
                  Model (optional)
                </label>
                <input
                  id="agent-model"
                  value={model}
                  onChange={(ev) => setModel(ev.target.value)}
                  list="agent-model-suggestions"
                  className="mt-1 h-10 w-full rounded-lg border border-white/10 bg-background px-3 text-sm text-foreground outline-none focus:border-accent/40 focus:ring-2 focus:ring-accent/20"
                  placeholder="e.g. gpt-4o"
                />
                <datalist id="agent-model-suggestions">
                  <option value="gpt-4o" />
                  <option value="gpt-4o-mini" />
                  <option value="claude-3-5-sonnet-20241022" />
                  <option value="claude-3-5-haiku-20241022" />
                </datalist>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button type="submit" variant="primary" disabled={spawnSubmitting}>
                  {spawnSubmitting ? "Spawning…" : "Spawn"}
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setSpawnOpen(false)}
                  disabled={spawnSubmitting}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : null}

      {tokenModal ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="agent-token-title"
        >
          <Card className="max-h-[90vh] w-full max-w-lg overflow-auto border-accent/30 shadow-xl">
            <CardHeader>
              <CardTitle id="agent-token-title">Agent token (copy now)</CardTitle>
              <p className="text-sm text-muted">
                This access token is shown only once. Store it securely. Agent ID:{" "}
                <span className="font-mono-brand text-accent-cyan">{tokenModal.agent_id}</span>
              </p>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="rounded-lg border border-white/10 bg-background/80 p-3">
                <pre className="max-h-40 overflow-auto whitespace-pre-wrap break-all font-mono-brand text-xs text-foreground">
                  {tokenModal.access_token}
                </pre>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button type="button" variant="primary" onClick={() => copyText(tokenModal.access_token)}>
                  <Copy className="h-4 w-4" />
                  Copy token
                </Button>
                <Button type="button" variant="secondary" onClick={() => setTokenModal(null)}>
                  Done
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : null}

      {listLoading ? (
        <div className="space-y-2 rounded-xl border border-white/10 bg-surface/80 p-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-10 animate-pulse rounded bg-white/5" />
          ))}
        </div>
      ) : agents.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-white/15 bg-surface/40 py-16 text-center">
          <Bot className="h-10 w-10 text-muted" />
          <p className="mt-3 text-sm font-medium text-foreground">No agents yet</p>
          <p className="mt-1 max-w-sm text-sm text-muted">
            Spawn an agent to issue short-lived tokens scoped to your policies.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-white/10 bg-surface/80">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10" />
                <TableHead>Agent ID</TableHead>
                <TableHead>Purpose</TableHead>
                <TableHead>Model</TableHead>
                <TableHead>Capabilities</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Spawned</TableHead>
                <TableHead>Expires</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {agents.map((a) => {
                const caps = Array.isArray(a.capabilities) ? a.capabilities : [];
                const status = String(a.status ?? "unknown");
                const expanded = expandedId === a.id;
                return (
                  <Fragment key={a.id}>
                    <TableRow>
                      <TableCell className="align-middle">
                        <button
                          type="button"
                          onClick={() => void toggleChain(a.id)}
                          className="rounded p-1 text-muted hover:bg-white/10 hover:text-foreground"
                          aria-expanded={expanded}
                          aria-label={expanded ? "Collapse delegation chain" : "Expand delegation chain"}
                        >
                          {expanded ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </button>
                      </TableCell>
                      <TableCell className="font-mono-brand text-accent-cyan">{a.id}</TableCell>
                      <TableCell className="font-medium">
                        {(a.purpose as string) || "—"}
                      </TableCell>
                      <TableCell className="text-muted">{(a.model as string) || "—"}</TableCell>
                      <TableCell>
                        <div className="flex max-w-[220px] flex-wrap gap-1">
                          {caps.map((c) => (
                            <Badge key={c} variant="muted" className="font-mono-brand text-[10px]">
                              {c}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusBadgeVariant(status)}>{status}</Badge>
                      </TableCell>
                      <TableCell className="tabular-nums text-muted">
                        {formatTime(a.created_at as string)}
                      </TableCell>
                      <TableCell className="tabular-nums text-muted">
                        {formatTime(a.expires_at as string)}
                      </TableCell>
                      <TableCell className="text-right">
                        {status.toLowerCase() === "active" ? (
                          <Button
                            type="button"
                            variant="danger"
                            className="text-xs"
                            onClick={() => void onTerminate(a.id)}
                          >
                            Terminate
                          </Button>
                        ) : (
                          <span className="text-xs text-muted">—</span>
                        )}
                      </TableCell>
                    </TableRow>
                    {expanded ? (
                      <TableRow className="bg-white/[0.02]">
                        <TableCell colSpan={9} className="border-t border-white/10 py-4">
                          <p className="mb-2 text-xs font-medium text-muted">Delegation chain</p>
                          {chainLoadingId === a.id ? (
                            <div className="h-16 animate-pulse rounded-lg bg-white/5" />
                          ) : (
                            <pre className="max-h-48 overflow-auto rounded-lg border border-white/10 bg-background/60 p-3 font-mono-brand text-[11px] leading-relaxed text-muted">
                              {JSON.stringify(chainById[a.id] ?? [], null, 2)}
                            </pre>
                          )}
                        </TableCell>
                      </TableRow>
                    ) : null}
                  </Fragment>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}

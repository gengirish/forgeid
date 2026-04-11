"use client";

import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { Copy, KeyRound, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
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
  if (!iso) return "Never";
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(iso));
}

type ApiKeyRow = {
  id: string;
  name: string;
  masked_key?: string;
  scopes: string[];
  revoked_at?: string | null;
  last_used_at?: string | null;
  created_at?: string;
};

export function ApiKeysPanel() {
  const { token, loading: authLoading } = useAuth();
  const [keys, setKeys] = useState<ApiKeyRow[]>([]);
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);

  const [createOpen, setCreateOpen] = useState(false);
  const [name, setName] = useState("");
  const [scopesInput, setScopesInput] = useState("agents:read, agents:write");
  const [createSubmitting, setCreateSubmitting] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const [rawKeyModal, setRawKeyModal] = useState<{ raw_key: string; name: string } | null>(null);

  const refresh = useCallback(async () => {
    if (!token) return;
    setListError(null);
    setListLoading(true);
    try {
      const res = await api.listApiKeys(token);
      setKeys((res.api_keys ?? []) as ApiKeyRow[]);
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : "Failed to load API keys";
      setListError(msg);
      setKeys([]);
    } finally {
      setListLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (authLoading || !token) return;
    void refresh();
  }, [authLoading, token, refresh]);

  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    const scopes = scopesInput
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    if (!name.trim()) {
      setCreateError("Name is required.");
      return;
    }
    if (scopes.length === 0) {
      setCreateError("Add at least one scope (comma-separated).");
      return;
    }
    setCreateError(null);
    setCreateSubmitting(true);
    try {
      const res = await api.createApiKey(token, { name: name.trim(), scopes });
      setCreateOpen(false);
      setName("");
      setScopesInput("agents:read, agents:write");
      setRawKeyModal({ raw_key: res.raw_key, name: res.name });
      await refresh();
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Failed to create key";
      setCreateError(msg);
    } finally {
      setCreateSubmitting(false);
    }
  }

  async function onRevoke(id: string) {
    if (!token) return;
    setListError(null);
    try {
      await api.revokeApiKey(token, id);
      await refresh();
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : "Failed to revoke";
      setListError(msg);
    }
  }

  function copyText(text: string) {
    void navigator.clipboard.writeText(text);
  }

  if (authLoading || !token) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 animate-pulse rounded-lg bg-white/5" />
        <div className="h-4 w-96 max-w-full animate-pulse rounded bg-white/5" />
        <div className="space-y-2 rounded-xl border border-white/10 bg-surface/80 p-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-10 animate-pulse rounded bg-white/5" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight text-foreground">
            API keys
          </h1>
          <p className="mt-1 text-sm text-muted">
            Server-to-server access. Raw secrets are shown once when a key is created.
          </p>
        </div>
        <Button
          type="button"
          variant="primary"
          className="gap-2"
          onClick={() => {
            setCreateOpen(true);
            setCreateError(null);
          }}
        >
          <Plus className="h-4 w-4" />
          Create key
        </Button>
      </div>
      <p className="text-xs text-muted">
        Keys are scoped to your organization.{" "}
        <Link href="/" className="text-accent hover:underline">
          Back to overview
        </Link>
      </p>

      {listError ? (
        <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
          {listError}
        </p>
      ) : null}

      {createOpen ? (
        <Card className="border-accent/25">
          <CardHeader>
            <CardTitle>New API key</CardTitle>
            <p className="text-sm text-muted">The raw secret will be shown once after creation.</p>
          </CardHeader>
          <CardContent>
            <form onSubmit={onCreate} className="flex flex-col gap-4 sm:max-w-md">
              {createError ? <p className="text-sm text-red-300">{createError}</p> : null}
              <div>
                <label htmlFor="key-name" className="text-xs font-medium text-muted">
                  Name
                </label>
                <input
                  id="key-name"
                  value={name}
                  onChange={(ev) => setName(ev.target.value)}
                  className="mt-1 h-10 w-full rounded-lg border border-white/10 bg-background px-3 text-sm text-foreground outline-none focus:border-accent/40 focus:ring-2 focus:ring-accent/20"
                  placeholder="e.g. CI — prod"
                  required
                />
              </div>
              <div>
                <label htmlFor="key-scopes" className="text-xs font-medium text-muted">
                  Scopes (comma-separated)
                </label>
                <input
                  id="key-scopes"
                  value={scopesInput}
                  onChange={(ev) => setScopesInput(ev.target.value)}
                  className="mt-1 h-10 w-full rounded-lg border border-white/10 bg-background px-3 font-mono-brand text-sm text-foreground outline-none focus:border-accent/40 focus:ring-2 focus:ring-accent/20"
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit" variant="primary" disabled={createSubmitting}>
                  {createSubmitting ? "Creating…" : "Generate"}
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setCreateOpen(false)}
                  disabled={createSubmitting}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : null}

      {rawKeyModal ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="raw-key-title"
        >
          <Card className="w-full max-w-lg border-amber-500/30 shadow-xl">
            <CardHeader>
              <CardTitle id="raw-key-title" className="text-accent-amber">
                Copy your API key now
              </CardTitle>
              <p className="text-sm font-medium text-foreground">
                This secret will not be shown again. Store it in a password manager or secret store.
              </p>
              <p className="text-xs text-muted">Key name: {rawKeyModal.name}</p>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="rounded-lg border border-white/10 bg-background/80 p-3">
                <pre className="max-h-40 overflow-auto whitespace-pre-wrap break-all font-mono-brand text-xs text-foreground">
                  {rawKeyModal.raw_key}
                </pre>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button type="button" variant="primary" onClick={() => copyText(rawKeyModal.raw_key)}>
                  <Copy className="h-4 w-4" />
                  Copy secret
                </Button>
                <Button type="button" variant="secondary" onClick={() => setRawKeyModal(null)}>
                  I’ve saved it
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : null}

      {listLoading ? (
        <div className="space-y-2 rounded-xl border border-white/10 bg-surface/80 p-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-10 animate-pulse rounded bg-white/5" />
          ))}
        </div>
      ) : keys.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-white/15 bg-surface/40 py-16 text-center">
          <KeyRound className="h-10 w-10 text-muted" />
          <p className="mt-3 text-sm font-medium text-foreground">No API keys yet</p>
          <p className="mt-1 max-w-sm text-sm text-muted">
            Create a key for automation, CI, or service-to-service calls.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-white/10 bg-surface/80">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Secret</TableHead>
                <TableHead>Scopes</TableHead>
                <TableHead>Last used</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {keys.map((k) => {
                const revoked = Boolean(k.revoked_at);
                return (
                  <TableRow
                    key={k.id}
                    className={revoked ? "opacity-60" : undefined}
                  >
                    <TableCell className="font-medium">{k.name}</TableCell>
                    <TableCell>
                      <span className="inline-flex items-center gap-2 font-mono-brand text-sm text-accent-cyan">
                        {k.masked_key ?? "—"}
                        {k.masked_key ? (
                          <button
                            type="button"
                            className="rounded p-1 text-muted hover:bg-white/10 hover:text-foreground"
                            aria-label="Copy masked key"
                            onClick={() => k.masked_key && copyText(k.masked_key)}
                          >
                            <Copy className="h-3.5 w-3.5" />
                          </button>
                        ) : null}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex max-w-[240px] flex-wrap gap-1">
                        {(k.scopes ?? []).map((s) => (
                          <Badge key={s} variant="info" className="font-mono-brand text-[10px]">
                            {s}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="tabular-nums text-muted">
                      {formatTime(k.last_used_at)}
                    </TableCell>
                    <TableCell className="tabular-nums text-muted">
                      {formatTime(k.created_at)}
                    </TableCell>
                    <TableCell>
                      {revoked ? (
                        <Badge variant="danger">Revoked</Badge>
                      ) : (
                        <Badge variant="success">Active</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        type="button"
                        variant="ghost"
                        className="gap-1 text-red-300 hover:bg-red-500/10 hover:text-red-200"
                        onClick={() => void onRevoke(k.id)}
                        disabled={revoked}
                      >
                        <Trash2 className="h-4 w-4" />
                        Revoke
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}

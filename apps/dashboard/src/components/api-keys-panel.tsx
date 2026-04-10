"use client";

const API_KEY_PREFIX = "sk_live_";
import { Copy, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import type { MockApiKey } from "../lib/mock-data";
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

function formatTime(iso: string | null) {
  if (!iso) return "Never";
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(iso));
}

export interface ApiKeysPanelProps {
  initialKeys: MockApiKey[];
}

export function ApiKeysPanel({ initialKeys }: ApiKeysPanelProps) {
  const [keys, setKeys] = useState(initialKeys);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [scopesInput, setScopesInput] = useState("agents:read, agents:write");

  function revoke(id: string) {
    setKeys((prev) => prev.filter((k) => k.id !== id));
  }

  function createKey(e: React.FormEvent) {
    e.preventDefault();
    const scopes = scopesInput
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const id = `key_${Math.random().toString(36).slice(2, 8)}`;
    const masked = `${API_KEY_PREFIX}${Math.random().toString(36).slice(2, 6)}…${Math.random().toString(36).slice(2, 6)}`;
    setKeys((prev) => [
      {
        id,
        maskedSecret: masked,
        name: name || "Untitled key",
        scopes: scopes.length ? scopes : ["agents:read"],
        lastUsedAt: null,
        createdAt: new Date().toISOString(),
      },
      ...prev,
    ]);
    setName("");
    setOpen(false);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight text-foreground">
            API keys
          </h1>
          <p className="mt-1 text-sm text-muted">
            Server-to-server access. Secrets are shown once on creation in production.
          </p>
        </div>
        <Button type="button" variant="primary" className="gap-2" onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4" />
          Create key
        </Button>
      </div>

      {open ? (
        <Card className="border-accent/25">
          <CardHeader>
            <CardTitle>New API key</CardTitle>
            <p className="text-sm text-muted">Demo form — values are stored in memory only.</p>
          </CardHeader>
          <CardContent>
            <form onSubmit={createKey} className="flex flex-col gap-4 sm:max-w-md">
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
                <Button type="submit" variant="primary">
                  Generate
                </Button>
                <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : null}

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Secret</TableHead>
            <TableHead>Scopes</TableHead>
            <TableHead>Last used</TableHead>
            <TableHead>Created</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {keys.map((k) => (
            <TableRow key={k.id}>
              <TableCell className="font-medium">{k.name}</TableCell>
              <TableCell>
                <span className="inline-flex items-center gap-2 font-mono-brand text-sm text-accent-cyan">
                  {k.maskedSecret}
                  <button
                    type="button"
                    className="rounded p-1 text-muted hover:bg-white/10 hover:text-foreground"
                    aria-label="Copy masked secret"
                    onClick={() => void navigator.clipboard.writeText(k.maskedSecret)}
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </button>
                </span>
              </TableCell>
              <TableCell>
                <div className="flex flex-wrap gap-1">
                  {k.scopes.map((s) => (
                    <Badge key={s} variant="info" className="font-mono-brand text-[10px]">
                      {s}
                    </Badge>
                  ))}
                </div>
              </TableCell>
              <TableCell className="tabular-nums text-muted">{formatTime(k.lastUsedAt)}</TableCell>
              <TableCell className="tabular-nums text-muted">{formatTime(k.createdAt)}</TableCell>
              <TableCell className="text-right">
                <Button
                  type="button"
                  variant="ghost"
                  className="gap-1 text-red-300 hover:bg-red-500/10 hover:text-red-200"
                  onClick={() => revoke(k.id)}
                >
                  <Trash2 className="h-4 w-4" />
                  Revoke
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

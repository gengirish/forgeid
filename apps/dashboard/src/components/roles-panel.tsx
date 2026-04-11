"use client";

import { Plus, Shield } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { api, ApiError } from "../lib/api";
import { useAuth } from "../lib/auth-context";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";

function RoleCardSkeleton() {
  return (
    <Card className="animate-pulse">
      <CardHeader className="flex flex-row items-start gap-3 space-y-0">
        <div className="h-10 w-10 rounded-lg bg-white/10" />
        <div className="min-w-0 flex-1 space-y-2">
          <div className="h-5 w-2/3 rounded bg-white/10" />
          <div className="h-4 w-full rounded bg-white/5" />
        </div>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-1 pt-0">
        <div className="h-5 w-16 rounded-md bg-white/10" />
        <div className="h-5 w-20 rounded-md bg-white/10" />
      </CardContent>
    </Card>
  );
}

function formatCreated(iso: string | undefined): string {
  if (!iso) return "—";
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(iso));
}

export function RolesPanel() {
  const { token, loading: authLoading } = useAuth();
  const [roles, setRoles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [permsInput, setPermsInput] = useState("agents:read, audit:read");
  const [submitting, setSubmitting] = useState(false);

  const refreshList = useCallback(async () => {
    if (!token) return;
    setError(null);
    try {
      const res = await api.listRoles(token);
      setRoles(res.roles ?? []);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Failed to load roles");
      setRoles([]);
    }
  }, [token]);

  useEffect(() => {
    if (authLoading) return;
    if (!token) {
      setLoading(false);
      setRoles([]);
      return;
    }
    setLoading(true);
    void refreshList().finally(() => setLoading(false));
  }, [authLoading, token, refreshList]);

  async function createRole(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    const permissions = permsInput
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    setSubmitting(true);
    setError(null);
    try {
      await api.createRole(token, {
        name: name.trim() || "New role",
        description: description.trim() || undefined,
        permissions: permissions.length ? permissions : ["agents:read"],
      });
      setName("");
      setDescription("");
      setOpen(false);
      await refreshList();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to create role");
    } finally {
      setSubmitting(false);
    }
  }

  if (!authLoading && !token) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight text-foreground">
            Roles & permissions
          </h1>
          <p className="mt-1 text-sm text-muted">Sign in to manage roles.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight text-foreground">
            Roles & permissions
          </h1>
          <p className="mt-1 text-sm text-muted">
            Fine-grained scopes attached to humans, agents, and keys.
          </p>
        </div>
        <Button type="button" variant="primary" className="gap-2" onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4" />
          Create role
        </Button>
      </div>

      {error ? (
        <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
          {error}
        </p>
      ) : null}

      {open ? (
        <Card className="border-accent/25">
          <CardHeader>
            <CardTitle>New role</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={(e) => void createRole(e)} className="flex max-w-lg flex-col gap-4">
              <div>
                <label htmlFor="role-name" className="text-xs font-medium text-muted">
                  Name
                </label>
                <input
                  id="role-name"
                  value={name}
                  onChange={(ev) => setName(ev.target.value)}
                  className="mt-1 h-10 w-full rounded-lg border border-white/10 bg-background px-3 text-sm text-foreground outline-none focus:border-accent/40 focus:ring-2 focus:ring-accent/20"
                  placeholder="e.g. Deploy Bot"
                />
              </div>
              <div>
                <label htmlFor="role-desc" className="text-xs font-medium text-muted">
                  Description
                </label>
                <input
                  id="role-desc"
                  value={description}
                  onChange={(ev) => setDescription(ev.target.value)}
                  className="mt-1 h-10 w-full rounded-lg border border-white/10 bg-background px-3 text-sm text-foreground outline-none focus:border-accent/40 focus:ring-2 focus:ring-accent/20"
                />
              </div>
              <div>
                <label htmlFor="role-perms" className="text-xs font-medium text-muted">
                  Permissions (comma-separated)
                </label>
                <input
                  id="role-perms"
                  value={permsInput}
                  onChange={(ev) => setPermsInput(ev.target.value)}
                  className="mt-1 h-10 w-full rounded-lg border border-white/10 bg-background px-3 font-mono-brand text-sm text-foreground outline-none focus:border-accent/40 focus:ring-2 focus:ring-accent/20"
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit" variant="primary" disabled={submitting}>
                  {submitting ? "Saving…" : "Save role"}
                </Button>
                <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        {authLoading || loading
          ? Array.from({ length: 4 }).map((_, i) => <RoleCardSkeleton key={i} />)
          : roles.map((r) => (
              <Card key={r.id}>
                <CardHeader className="flex flex-row items-start gap-3 space-y-0">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-accent/25 bg-accent/10 text-accent">
                    <Shield className="h-5 w-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <CardTitle className="text-base">{r.name}</CardTitle>
                      {r.is_system ? (
                        <Badge variant="warning" className="text-[10px]">
                          system
                        </Badge>
                      ) : null}
                    </div>
                    <p className="mt-1 text-sm text-muted">{r.description ?? "—"}</p>
                    <p className="mt-2 text-xs text-muted">
                      {(r.permissions?.length ?? 0)} permission
                      {r.permissions?.length === 1 ? "" : "s"} · Created {formatCreated(r.created_at)}
                    </p>
                  </div>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-1 pt-0">
                  {(r.permissions ?? []).map((p: string) => (
                    <Badge key={p} variant="info" className="font-mono-brand text-[10px]">
                      {p}
                    </Badge>
                  ))}
                </CardContent>
              </Card>
            ))}
      </div>

      {!loading && !authLoading && roles.length === 0 && !error ? (
        <p className="text-center text-sm text-muted">No custom roles yet.</p>
      ) : null}
    </div>
  );
}

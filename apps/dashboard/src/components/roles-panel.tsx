"use client";

import { Plus, Shield } from "lucide-react";
import { useState } from "react";
import type { MockRole } from "../lib/mock-data";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";

export interface RolesPanelProps {
  initialRoles: MockRole[];
}

export function RolesPanel({ initialRoles }: RolesPanelProps) {
  const [roles, setRoles] = useState(initialRoles);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [permsInput, setPermsInput] = useState("agents:read, audit:read");

  function createRole(e: React.FormEvent) {
    e.preventDefault();
    const permissions = permsInput
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const id = `role_${Math.random().toString(36).slice(2, 8)}`;
    setRoles((prev) => [
      ...prev,
      {
        id,
        name: name || "New role",
        description: description || "—",
        permissions: permissions.length ? permissions : ["agents:read"],
      },
    ]);
    setName("");
    setDescription("");
    setOpen(false);
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

      {open ? (
        <Card className="border-accent/25">
          <CardHeader>
            <CardTitle>New role</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={createRole} className="flex max-w-lg flex-col gap-4">
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
                <Button type="submit" variant="primary">
                  Save role
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
        {roles.map((r) => (
          <Card key={r.id}>
            <CardHeader className="flex flex-row items-start gap-3 space-y-0">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-accent/25 bg-accent/10 text-accent">
                <Shield className="h-5 w-5" />
              </span>
              <div className="min-w-0 flex-1">
                <CardTitle className="text-base">{r.name}</CardTitle>
                <p className="mt-1 text-sm text-muted">{r.description}</p>
                <p className="mt-2 text-xs text-muted">
                  {r.permissions.length} permission
                  {r.permissions.length === 1 ? "" : "s"}
                </p>
              </div>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-1 pt-0">
              {r.permissions.map((p) => (
                <Badge key={p} variant="info" className="font-mono-brand text-[10px]">
                  {p}
                </Badge>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

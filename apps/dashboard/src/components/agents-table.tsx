"use client";

import { Bot, Plus } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import type { MockAgent } from "../lib/mock-data";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";

function formatTime(iso: string) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(iso));
}

export interface AgentsTableProps {
  initialAgents: MockAgent[];
}

export function AgentsTable({ initialAgents }: AgentsTableProps) {
  const [agents, setAgents] = useState(initialAgents);

  function terminate(id: string) {
    setAgents((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: "terminated" as const } : a)),
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
        <Button type="button" variant="primary" className="gap-2">
          <Plus className="h-4 w-4" />
          Spawn agent
        </Button>
      </div>
      <p className="text-xs text-muted">
        Spawn flow is mocked for demo — wire to API later.{" "}
        <Link href="/" className="text-accent hover:underline">
          Back to overview
        </Link>
      </p>

      <Table>
        <TableHeader>
          <TableRow>
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
          {agents.map((a) => (
            <TableRow key={a.id}>
              <TableCell className="font-mono-brand text-accent-cyan">{a.id}</TableCell>
              <TableCell className="font-medium">{a.purpose}</TableCell>
              <TableCell className="text-muted">{a.model}</TableCell>
              <TableCell>
                <div className="flex flex-wrap gap-1">
                  {a.capabilities.map((c) => (
                    <Badge key={c} variant="muted" className="font-mono-brand text-[10px]">
                      {c}
                    </Badge>
                  ))}
                </div>
              </TableCell>
              <TableCell>
                <Badge variant={a.status === "active" ? "success" : "muted"}>
                  {a.status}
                </Badge>
              </TableCell>
              <TableCell className="tabular-nums text-muted">{formatTime(a.spawnedAt)}</TableCell>
              <TableCell className="tabular-nums text-muted">{formatTime(a.expiresAt)}</TableCell>
              <TableCell className="text-right">
                {a.status === "active" ? (
                  <Button
                    type="button"
                    variant="danger"
                    className="text-xs"
                    onClick={() => terminate(a.id)}
                  >
                    Terminate
                  </Button>
                ) : (
                  <span className="text-xs text-muted">—</span>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {agents.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-white/15 py-16 text-center">
          <Bot className="h-10 w-10 text-muted" />
          <p className="mt-3 text-sm font-medium text-foreground">No agents yet</p>
          <p className="mt-1 max-w-sm text-sm text-muted">
            Spawn an agent to issue short-lived tokens scoped to your policies.
          </p>
        </div>
      ) : null}
    </div>
  );
}

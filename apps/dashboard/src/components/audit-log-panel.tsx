"use client";

import { ChevronDown, ChevronRight } from "lucide-react";
import { useMemo, useState } from "react";
import type { MockAuditEvent } from "../lib/mock-data";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";

type Range = "1h" | "24h" | "7d" | "30d";

function badgeVariant(
  outcome: MockAuditEvent["outcome"],
): "success" | "danger" | "info" {
  if (outcome === "allowed") return "success";
  if (outcome === "denied") return "danger";
  return "info";
}

function inRange(iso: string, range: Range): boolean {
  const t = new Date(iso).getTime();
  const now = Date.now();
  const ms =
    range === "1h"
      ? 3600_000
      : range === "24h"
        ? 86400_000
        : range === "7d"
          ? 7 * 86400_000
          : 30 * 86400_000;
  return now - t <= ms;
}

export interface AuditLogPanelProps {
  events: MockAuditEvent[];
}

export function AuditLogPanel({ events }: AuditLogPanelProps) {
  const [range, setRange] = useState<Range>("24h");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const filtered = useMemo(
    () => events.filter((e) => inRange(e.timestamp, range)),
    [events, range],
  );

  function toggle(id: string) {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
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
        <div className="flex flex-wrap gap-2">
          {(
            [
              ["1h", "1h"],
              ["24h", "24h"],
              ["7d", "7d"],
              ["30d", "30d"],
            ] as const
          ).map(([key, label]) => (
            <Button
              key={key}
              type="button"
              variant={range === key ? "primary" : "secondary"}
              className="h-9 min-w-[3.5rem] px-3 text-xs"
              onClick={() => setRange(key)}
            >
              {label}
            </Button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        {filtered.map((e) => {
          const open = expanded[e.id];
          return (
            <Card key={e.id} className="overflow-hidden">
              <CardContent className="p-0">
                <button
                  type="button"
                  className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-white/[0.03]"
                  onClick={() => toggle(e.id)}
                  aria-expanded={open}
                >
                  {open ? (
                    <ChevronDown className="h-4 w-4 shrink-0 text-muted" />
                  ) : (
                    <ChevronRight className="h-4 w-4 shrink-0 text-muted" />
                  )}
                  <Badge variant={badgeVariant(e.outcome)}>{e.outcome}</Badge>
                  <span className="font-mono-brand text-sm text-accent-cyan">{e.type}</span>
                  <span className="hidden min-w-0 flex-1 truncate text-sm text-muted sm:block">
                    {e.actor} · {e.resource}
                  </span>
                  <time
                    className="shrink-0 text-xs tabular-nums text-muted"
                    dateTime={e.timestamp}
                  >
                    {new Intl.DateTimeFormat("en-US", {
                      dateStyle: "medium",
                      timeStyle: "medium",
                    }).format(new Date(e.timestamp))}
                  </time>
                </button>
                {open ? (
                  <div className="border-t border-white/10 bg-background/50 px-4 py-3">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted">
                      Metadata
                    </p>
                    <pre className="font-mono-brand mt-2 max-h-48 overflow-auto rounded-lg border border-white/10 bg-black/30 p-3 text-xs text-foreground">
                      {JSON.stringify(e.metadata, null, 2)}
                    </pre>
                  </div>
                ) : null}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <p className="text-center text-sm text-muted">No events in this window.</p>
      ) : null}
    </div>
  );
}

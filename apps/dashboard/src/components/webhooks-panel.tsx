"use client";

import { ChevronDown, ChevronRight, Radio } from "lucide-react";
import { useMemo, useState } from "react";
import type { MockDelivery, MockWebhook } from "../lib/mock-data";
import { getDeliveriesForWebhook } from "../lib/mock-data";
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

function deliveryBadge(status: MockDelivery["status"]) {
  if (status === "success") return "success" as const;
  if (status === "failed") return "danger" as const;
  return "warning" as const;
}

export interface WebhooksPanelProps {
  initialWebhooks: MockWebhook[];
}

export function WebhooksPanel({ initialWebhooks }: WebhooksPanelProps) {
  const [webhooks, setWebhooks] = useState(initialWebhooks);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [showForm, setShowForm] = useState(false);
  const [url, setUrl] = useState("");
  const [eventsInput, setEventsInput] = useState("audit.event, agent.spawned");

  const deliveriesByWebhook = useMemo(() => {
    const map = new Map<string, MockDelivery[]>();
    for (const w of webhooks) {
      map.set(w.id, getDeliveriesForWebhook(w.id));
    }
    return map;
  }, [webhooks]);

  function toggle(id: string) {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  function addWebhook(e: React.FormEvent) {
    e.preventDefault();
    const events = eventsInput
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const id = `whk_${Math.random().toString(36).slice(2, 8)}`;
    setWebhooks((prev) => [
      {
        id,
        url: url || "https://example.com/hook",
        status: "active",
        events: events.length ? events : ["audit.event"],
        createdAt: new Date().toISOString(),
      },
      ...prev,
    ]);
    setUrl("");
    setShowForm(false);
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

      {showForm ? (
        <Card className="border-accent-cyan/20">
          <CardHeader>
            <CardTitle>New endpoint</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={addWebhook} className="flex max-w-lg flex-col gap-4">
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
                <label htmlFor="wh-events" className="text-xs font-medium text-muted">
                  Events (comma-separated)
                </label>
                <input
                  id="wh-events"
                  value={eventsInput}
                  onChange={(ev) => setEventsInput(ev.target.value)}
                  className="mt-1 h-10 w-full rounded-lg border border-white/10 bg-background px-3 font-mono-brand text-sm text-foreground outline-none focus:border-accent-cyan/40 focus:ring-2 focus:ring-accent-cyan/20"
                />
              </div>
              <Button type="submit" variant="secondary" className="w-fit">
                Save endpoint
              </Button>
            </form>
          </CardContent>
        </Card>
      ) : null}

      <div className="space-y-3">
        {webhooks.map((w) => {
          const open = expanded[w.id];
          const deliveries = deliveriesByWebhook.get(w.id) ?? [];
          return (
            <Card key={w.id} className="overflow-hidden">
              <CardContent className="p-0">
                <div className="flex flex-wrap items-center gap-3 border-b border-white/5 px-4 py-3">
                  <button
                    type="button"
                    className="flex items-center gap-2 text-left text-sm font-medium text-foreground hover:text-accent"
                    onClick={() => toggle(w.id)}
                    aria-expanded={open}
                  >
                    {open ? (
                      <ChevronDown className="h-4 w-4 text-muted" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-muted" />
                    )}
                    <Radio className="h-4 w-4 text-accent-cyan" />
                    <span className="font-mono-brand text-accent-cyan">{w.id}</span>
                  </button>
                  <Badge variant={w.status === "active" ? "success" : "muted"}>
                    {w.status}
                  </Badge>
                  <span className="min-w-0 flex-1 truncate text-sm text-muted">{w.url}</span>
                </div>
                <div className="flex flex-wrap gap-1 border-b border-white/5 px-4 py-2">
                  {w.events.map((ev) => (
                    <Badge key={ev} variant="info" className="font-mono-brand text-[10px]">
                      {ev}
                    </Badge>
                  ))}
                </div>
                {open ? (
                  <div className="p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                      Delivery log
                    </p>
                    <div className="mt-3">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Delivery</TableHead>
                            <TableHead>Event</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>HTTP</TableHead>
                            <TableHead>Attempted</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {deliveries.map((d) => (
                            <TableRow key={d.id}>
                              <TableCell className="font-mono-brand text-xs text-muted">
                                {d.id}
                              </TableCell>
                              <TableCell className="font-mono-brand text-xs">{d.eventType}</TableCell>
                              <TableCell>
                                <Badge variant={deliveryBadge(d.status)}>{d.status}</Badge>
                              </TableCell>
                              <TableCell className="tabular-nums text-muted">
                                {d.statusCode ?? "—"}
                              </TableCell>
                              <TableCell className="tabular-nums text-muted text-xs">
                                {new Intl.DateTimeFormat("en-US", {
                                  dateStyle: "short",
                                  timeStyle: "medium",
                                }).format(new Date(d.attemptedAt))}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                ) : null}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

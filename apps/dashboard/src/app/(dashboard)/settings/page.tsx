"use client";

import { useAuth } from "@/lib/auth-context";
import { ApiError, api } from "@/lib/api";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

type Org = {
  id: string;
  name: string;
  slug: string;
  plan: string;
  created_at: string;
  updated_at?: string;
};

type Member = {
  user_id: string;
  email: string;
  name: string;
  role: string;
  created_at: string;
};

const ROLE_OPTIONS = ["owner", "admin", "member"] as const;

function roleSelectOptions(currentRole: string) {
  const set = new Set<string>([...ROLE_OPTIONS]);
  if (currentRole && !set.has(currentRole)) set.add(currentRole);
  return Array.from(set);
}

const inputClass =
  "mt-1 h-10 w-full rounded-lg border border-white/10 bg-background px-3 text-sm text-foreground outline-none focus:border-accent/40 focus:ring-2 focus:ring-accent/20";

function formatDate(iso: string | undefined) {
  if (!iso) return "—";
  try {
    return new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function roleBadgeVariant(role: string): "success" | "info" | "warning" | "muted" | "default" {
  const r = role.toLowerCase();
  if (r === "owner") return "success";
  if (r === "admin") return "info";
  if (r === "member") return "muted";
  return "default";
}

export default function SettingsPage() {
  const { token, user, loading: authLoading, logout } = useAuth();

  const [org, setOrg] = useState<Org | null>(null);
  const [orgName, setOrgName] = useState("");
  const [members, setMembers] = useState<Member[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [orgSaving, setOrgSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteName, setInviteName] = useState("");
  const [inviteRole, setInviteRole] = useState<string>("member");
  const [inviteSubmitting, setInviteSubmitting] = useState(false);

  const [memberBusy, setMemberBusy] = useState<Record<string, "role" | "remove" | undefined>>({});

  const loadData = useCallback(async () => {
    if (!token) return;
    setDataLoading(true);
    setFeedback(null);
    try {
      const [orgRes, membersRes] = await Promise.all([api.getOrg(token), api.getMembers(token)]);
      const o = orgRes.org as Org;
      setOrg(o);
      setOrgName(o.name ?? "");
      setMembers((membersRes.members ?? []) as Member[]);
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : "Failed to load settings.";
      setFeedback({ type: "error", message: msg });
    } finally {
      setDataLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (!authLoading && token) void loadData();
  }, [authLoading, token, loadData]);

  const ownerCount = useMemo(() => members.filter((m) => m.role?.toLowerCase() === "owner").length, [members]);
  const isSoleOwner = user?.role?.toLowerCase() === "owner" && ownerCount === 1;

  function hideSelfManagement(member: Member) {
    return user?.id === member.user_id && isSoleOwner;
  }

  async function handleSaveOrgName(e: React.FormEvent) {
    e.preventDefault();
    if (!token || !org) return;
    setOrgSaving(true);
    setFeedback(null);
    try {
      const res = await api.updateOrg(token, { name: orgName.trim() || undefined });
      const updated = res.org as Org;
      setOrg(updated);
      setOrgName(updated.name ?? orgName);
      setFeedback({ type: "success", message: "Organization name updated." });
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Could not update organization.";
      setFeedback({ type: "error", message: msg });
    } finally {
      setOrgSaving(false);
    }
  }

  async function handleRoleChange(member: Member, role: string) {
    if (!token || member.role === role) return;
    setMemberBusy((b) => ({ ...b, [member.user_id]: "role" }));
    setFeedback(null);
    try {
      const res = await api.changeMemberRole(token, member.user_id, role);
      const updated = res.member as Member;
      setMembers((prev) =>
        prev.map((m) => (m.user_id === member.user_id ? { ...m, ...updated, role: updated.role ?? role } : m)),
      );
      setFeedback({ type: "success", message: "Role updated." });
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Could not change role.";
      setFeedback({ type: "error", message: msg });
    } finally {
      setMemberBusy((b) => {
        const next = { ...b };
        delete next[member.user_id];
        return next;
      });
    }
  }

  async function handleRemoveMember(member: Member) {
    if (!token) return;
    const ok = window.confirm(`Remove ${member.name || member.email} from the organization?`);
    if (!ok) return;
    setMemberBusy((b) => ({ ...b, [member.user_id]: "remove" }));
    setFeedback(null);
    try {
      await api.removeMember(token, member.user_id);
      setMembers((prev) => prev.filter((m) => m.user_id !== member.user_id));
      setFeedback({ type: "success", message: "Member removed." });
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Could not remove member.";
      setFeedback({ type: "error", message: msg });
    } finally {
      setMemberBusy((b) => {
        const next = { ...b };
        delete next[member.user_id];
        return next;
      });
    }
  }

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    const email = inviteEmail.trim();
    const name = inviteName.trim();
    if (!email) {
      setFeedback({ type: "error", message: "Email is required." });
      return;
    }
    setInviteSubmitting(true);
    setFeedback(null);
    try {
      const res = await api.inviteMember(token, { email, name: name || email, role: inviteRole });
      const m = res.member as Member;
      setMembers((prev) => {
        const exists = prev.some((x) => x.user_id === m.user_id);
        if (exists) {
          return prev.map((x) => (x.user_id === m.user_id ? { ...x, ...m } : x));
        }
        return [...prev, m];
      });
      setInviteEmail("");
      setInviteName("");
      setInviteRole("member");
      setFeedback({ type: "success", message: "Invitation sent." });
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Could not invite member.";
      setFeedback({ type: "error", message: msg });
    } finally {
      setInviteSubmitting(false);
    }
  }

  if (authLoading || !token) {
    return (
      <div className="text-sm text-muted">
        {authLoading ? "Loading…" : "Sign in required."}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight text-foreground">Settings</h1>
        <p className="mt-1 text-sm text-muted">Organization profile, team, and account actions.</p>
      </div>

      {feedback ? (
        <div
          role="status"
          className={cn(
            "rounded-lg border px-4 py-3 text-sm",
            feedback.type === "success"
              ? "border-accent/30 bg-accent/10 text-accent"
              : "border-red-500/40 bg-red-500/10 text-red-200",
          )}
        >
          {feedback.message}
        </div>
      ) : null}

      {/* Section 1: Organization */}
      <section className="space-y-3">
        <h2 className="font-heading text-lg font-semibold text-foreground">Organization</h2>
        <Card>
          <CardHeader>
            <CardTitle>Organization info</CardTitle>
            <CardDescription>Name, identifier, plan, and when the workspace was created.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {dataLoading && !org ? (
              <p className="text-sm text-muted">Loading organization…</p>
            ) : org ? (
              <>
                <dl className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <dt className="text-xs font-medium uppercase tracking-wide text-muted">Slug</dt>
                    <dd className="mt-1 font-mono text-sm text-foreground">{org.slug}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium uppercase tracking-wide text-muted">Plan</dt>
                    <dd className="mt-1 text-sm capitalize text-foreground">{org.plan ?? "—"}</dd>
                  </div>
                  <div className="sm:col-span-2">
                    <dt className="text-xs font-medium uppercase tracking-wide text-muted">Created</dt>
                    <dd className="mt-1 text-sm text-foreground">{formatDate(org.created_at)}</dd>
                  </div>
                </dl>

                <form onSubmit={handleSaveOrgName} className="space-y-3 border-t border-white/10 pt-6">
                  <div>
                    <label htmlFor="org-name" className="text-xs font-medium text-muted">
                      Organization name
                    </label>
                    <input
                      id="org-name"
                      value={orgName}
                      onChange={(e) => setOrgName(e.target.value)}
                      className={inputClass}
                      autoComplete="organization"
                    />
                  </div>
                  <Button type="submit" variant="primary" disabled={orgSaving || orgName === (org.name ?? "")}>
                    {orgSaving ? "Saving…" : "Save"}
                  </Button>
                </form>
              </>
            ) : (
              <p className="text-sm text-muted">Could not load organization.</p>
            )}
          </CardContent>
        </Card>
      </section>

      {/* Section 2: Team */}
      <section className="space-y-3">
        <h2 className="font-heading text-lg font-semibold text-foreground">Team members</h2>
        <Card>
          <CardHeader>
            <CardTitle>Members</CardTitle>
            <CardDescription>People with access to this organization. Manage roles or invite someone new.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {dataLoading && members.length === 0 ? (
              <p className="text-sm text-muted">Loading members…</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {members.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted">
                        No members yet.
                      </TableCell>
                    </TableRow>
                  ) : (
                    members.map((m) => {
                      const hideActions = hideSelfManagement(m);
                      const busy = memberBusy[m.user_id];
                      return (
                        <TableRow key={m.user_id}>
                          <TableCell className="font-medium">{m.name || "—"}</TableCell>
                          <TableCell className="text-muted">{m.email}</TableCell>
                          <TableCell>
                            <Badge variant={roleBadgeVariant(m.role)}>{m.role}</Badge>
                          </TableCell>
                          <TableCell className="text-muted">{formatDate(m.created_at)}</TableCell>
                          <TableCell className="text-right">
                            {hideActions ? (
                              <span className="text-xs text-muted">Sole owner — transfer role before changes</span>
                            ) : (
                              <div className="flex flex-wrap items-center justify-end gap-2">
                                <select
                                  className="h-9 rounded-lg border border-white/10 bg-background px-2 text-sm text-foreground outline-none focus:border-accent/40 focus:ring-2 focus:ring-accent/20"
                                  value={m.role}
                                  disabled={!!busy}
                                  onChange={(e) => void handleRoleChange(m, e.target.value)}
                                >
                                  {roleSelectOptions(m.role).map((r) => (
                                    <option key={r} value={r}>
                                      {r}
                                    </option>
                                  ))}
                                </select>
                                <Button
                                  type="button"
                                  variant="danger"
                                  className="shrink-0"
                                  disabled={!!busy}
                                  onClick={() => void handleRemoveMember(m)}
                                >
                                  {busy === "remove" ? "…" : "Remove"}
                                </Button>
                              </div>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            )}

            <div className="border-t border-white/10 pt-6">
              <h3 className="text-sm font-semibold text-foreground">Invite member</h3>
              <form onSubmit={handleInvite} className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="sm:col-span-2 lg:col-span-1">
                  <label htmlFor="invite-email" className="text-xs font-medium text-muted">
                    Email
                  </label>
                  <input
                    id="invite-email"
                    type="email"
                    required
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className={inputClass}
                    placeholder="colleague@company.com"
                    autoComplete="email"
                  />
                </div>
                <div>
                  <label htmlFor="invite-name" className="text-xs font-medium text-muted">
                    Name
                  </label>
                  <input
                    id="invite-name"
                    value={inviteName}
                    onChange={(e) => setInviteName(e.target.value)}
                    className={inputClass}
                    placeholder="Display name"
                    autoComplete="name"
                  />
                </div>
                <div>
                  <label htmlFor="invite-role" className="text-xs font-medium text-muted">
                    Role
                  </label>
                  <select
                    id="invite-role"
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value)}
                    className={inputClass}
                  >
                    {ROLE_OPTIONS.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex items-end sm:col-span-2 lg:col-span-1">
                  <Button type="submit" variant="primary" className="w-full" disabled={inviteSubmitting}>
                    {inviteSubmitting ? "Inviting…" : "Invite member"}
                  </Button>
                </div>
              </form>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Section 3: Danger zone */}
      <section className="space-y-3">
        <h2 className="font-heading text-lg font-semibold text-foreground">Danger zone</h2>
        <Card className="border-red-500/20">
          <CardHeader>
            <CardTitle className="text-red-300">Sign out</CardTitle>
            <CardDescription>End your session on this device. You will need to sign in again to access the dashboard.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button type="button" variant="danger" onClick={() => logout()}>
              Sign out
            </Button>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

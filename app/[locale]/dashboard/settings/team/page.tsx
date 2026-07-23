"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/input";
import { SkeletonRow } from "@/components/ui/skeleton";
import { toast } from "@/components/ui/toaster";
import type { StaffAccount, StaffRole } from "@/types";

const ROLES: Exclude<StaffRole, "owner">[] = ["admin", "manager", "staff"];

export default function TeamSettingsPage() {
  const t = useTranslations("settings.team");
  const [staff, setStaff] = useState<StaffAccount[]>([]);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Exclude<StaffRole, "owner">>("staff");
  const [inviting, setInviting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const res = await fetch("/api/settings/team");
    const json = await res.json();
    if (res.ok) setStaff(json.data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function invite(e: React.FormEvent) {
    e.preventDefault();
    setInviting(true);
    setError(null);
    const res = await fetch("/api/settings/team", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, role }),
    });
    const json = await res.json();
    setInviting(false);
    if (!res.ok) {
      setError(json.error?.message ?? t("inviteFailed"));
      return;
    }
    setEmail("");
    load();
  }

  async function updateRole(staffId: string, newRole: Exclude<StaffRole, "owner">) {
    const res = await fetch(`/api/settings/team/${staffId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: newRole }),
    });
    if (!res.ok) {
      toast.error(t("actionFailed"));
      return;
    }
    load();
  }

  async function revoke(staffId: string) {
    const res = await fetch(`/api/settings/team/${staffId}`, { method: "DELETE" });
    if (!res.ok) {
      toast.error(t("actionFailed"));
      return;
    }
    load();
  }

  return (
    <div className="max-w-2xl space-y-8">
      <form onSubmit={invite} className="space-y-4 rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5">
        <p className="text-sm font-semibold text-[var(--ink)]">{t("inviteTitle")}</p>
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex-1 min-w-[200px]">
            <Label htmlFor="email">{t("email")}</Label>
            <Input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="role">{t("role")}</Label>
            <Select
              id="role"
              value={role}
              onChange={(e) => setRole(e.target.value as Exclude<StaffRole, "owner">)}
              className="w-auto"
            >
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {t(`roles.${r}`)}
                </option>
              ))}
            </Select>
          </div>
          <Button type="submit" disabled={inviting}>
            {inviting ? t("inviting") : t("invite")}
          </Button>
        </div>
        {error && <p className="text-sm text-[var(--danger)]">{error}</p>}
      </form>

      <div>
        <p className="mb-3 text-sm font-semibold text-[var(--ink)]">{t("membersTitle")}</p>
        {loading ? (
          <div className="space-y-2">
            <SkeletonRow />
            <SkeletonRow />
          </div>
        ) : staff.length === 0 ? (
          <p className="text-sm text-[var(--muted)]">{t("noMembers")}</p>
        ) : (
          <ul className="space-y-2">
            {staff.map((member) => (
              <li
                key={member.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[var(--line)] px-4 py-3"
              >
                <div>
                  <p className="text-sm font-medium text-[var(--ink)]">{member.invited_email}</p>
                  <p className="text-xs text-[var(--muted)]">
                    {t(`status.${member.status}`)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Select
                    value={member.role}
                    onChange={(e) => updateRole(member.id, e.target.value as Exclude<StaffRole, "owner">)}
                    className="h-9 w-auto"
                  >
                    {ROLES.map((r) => (
                      <option key={r} value={r}>
                        {t(`roles.${r}`)}
                      </option>
                    ))}
                  </Select>
                  <Button type="button" variant="ghost" size="sm" onClick={() => revoke(member.id)}>
                    {t("revoke")}
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

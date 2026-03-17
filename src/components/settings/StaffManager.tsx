"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import type { Invite, Profile } from "@/types/database";
import type { StaffEntry } from "@/app/actions/invites";
import { listStaffAction, createInviteAction } from "@/app/actions/invites";
import { useApp } from "@/components/providers/AppProvider";
import { getT } from "@/lib/i18n";

type StaffRow =
  | {
      kind: "active";
      id: string;
      name: string;
      email: string;
      role: string;
      status: "active";
    }
  | {
      kind: "invite";
      id: string;
      name: string;
      email: string;
      role: string;
      status: "invited";
      token: string;
      created_at: string;
    };

function mapEntriesToRows(entries: StaffEntry[]): StaffRow[] {
  const rows: StaffRow[] = [];

  entries.forEach((entry) => {
    if (entry.type === "profile") {
      const p: Profile = entry.profile;
      rows.push({
        kind: "active",
        id: p.id,
        name: p.full_name ?? "",
        email: p.email,
        role: p.role,
        status: "active",
      });
    } else {
      const i: Invite = entry.invite;
      const status: StaffRow["status"] = i.accepted_at ? "active" : "invited";
      if (status === "invited") {
        rows.push({
          kind: "invite",
          id: i.id,
          name: i.full_name ?? "",
          email: i.email,
          role: i.role,
          status,
          token: i.token,
          created_at: i.created_at,
        });
      }
    }
  });

  return rows;
}

export function StaffManager() {
  const router = useRouter();
  const { lang } = useApp();
  const t = getT(lang);
  const [rows, setRows] = useState<StaffRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteName, setInviteName] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      const result = await listStaffAction().catch((err) => ({
        data: [] as StaffEntry[],
        error: err instanceof Error ? err.message : String(err),
      }));
      if (!result) {
        if (!cancelled) {
          setLoading(false);
          alert("Fehler beim Laden der Mitarbeiter.");
        }
        return;
      }
      const { data, error } = result;
      if (cancelled) return;
      setLoading(false);
      if (error) {
        alert(error);
        return;
      }
      setRows(mapEntriesToRows(data));
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleInvite() {
    if (!inviteEmail.trim()) {
      alert(t("staff.enterEmail"));
      return;
    }
    setCreating(true);
    const res = await createInviteAction(inviteEmail.trim(), inviteName.trim() || null);
    setCreating(false);
    if (res.error || !res.token) {
      alert(res.error ?? "Einladung konnte nicht erstellt werden.");
      return;
    }

    const link = `${window.location.origin}/register?token=${encodeURIComponent(res.token)}`;
    alert(
      t("staff.inviteCreated") +
        "\n\n" +
        link
    );
    setInviteEmail("");
    setInviteName("");
    router.refresh();
  }

  return (
    <div className="card p-6 space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            {t("staff.title")}
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            {t("staff.subtitle")}
          </p>
        </div>
        <div className="flex flex-col gap-2 md:flex-row md:items-end">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              {t("staff.inviteEmail")}
            </label>
            <input
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              className="input-base mt-1 w-64"
              placeholder="name@beispiel.de"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              {t("staff.inviteName")}
            </label>
            <input
              type="text"
              value={inviteName}
              onChange={(e) => setInviteName(e.target.value)}
              className="input-base mt-1 w-64"
              placeholder={t("staff.inviteNamePlaceholder")}
            />
          </div>
          <button
            type="button"
            onClick={handleInvite}
            disabled={creating}
            className="btn-primary mt-2 inline-flex items-center gap-2 md:mt-0"
          >
            <Plus className="h-4 w-4" />
            {creating ? t("staff.inviting") : t("staff.inviteButton")}
          </button>
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-gray-500">{t("staff.loading")}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                  {t("staff.name")}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                  {t("staff.email")}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                  {t("staff.role")}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                  {t("staff.status")}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {rows.map((row) => (
                <tr key={`${row.kind}-${row.id}`}>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {row.name || "—"}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {row.email}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {row.role}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {row.status === "active" ? t("staff.statusActive") : t("staff.statusInvited")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}


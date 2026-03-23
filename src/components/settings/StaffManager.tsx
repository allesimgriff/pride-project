"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { Invite, Profile } from "@/types/database";
import type { StaffEntry } from "@/app/actions/invites";
import { listStaffAction, revokeInviteAction } from "@/app/actions/invites";
import { transferAdminAction, demoteAdminAction } from "@/app/actions/staff";
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
  const [transferingId, setTransferingId] = useState<string | null>(null);
  const [demotingId, setDemotingId] = useState<string | null>(null);
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [loadNonce, setLoadNonce] = useState(0);

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
  }, [loadNonce]);

  async function handleTransferAdmin(targetId: string) {
    if (!window.confirm(t("staff.transferAdminConfirm"))) return;
    setTransferingId(targetId);
    const res = await transferAdminAction(targetId).catch((err) => ({
      error: err instanceof Error ? err.message : String(err),
    }));
    setTransferingId(null);

    if (res?.error) {
      alert(res.error);
      return;
    }
    alert(t("staff.transferAdminDone"));
    setLoadNonce((n) => n + 1);
    router.refresh();
  }

  async function handleDemoteAdmin(targetId: string) {
    if (!window.confirm(t("staff.demoteAdminConfirm"))) return;
    setDemotingId(targetId);
    const res = await demoteAdminAction(targetId).catch((err) => ({
      error: err instanceof Error ? err.message : String(err),
    }));
    setDemotingId(null);

    if (res?.error) {
      alert(res.error);
      return;
    }

    alert(t("staff.demoteAdminDone"));
    setLoadNonce((n) => n + 1);
    router.refresh();
  }

  async function handleRevokeInvite(inviteId: string) {
    if (!window.confirm(t("staff.revokeInviteConfirm"))) return;
    setRevokingId(inviteId);
    const res = await revokeInviteAction(inviteId).catch((err) => ({
      error: err instanceof Error ? err.message : String(err),
    }));
    setRevokingId(null);

    if (res?.error) {
      alert(res.error);
      return;
    }

    alert(t("staff.revokeInviteDone"));
    setLoadNonce((n) => n + 1);
    router.refresh();
  }

  return (
    <div className="card p-6 space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">
          {t("staff.title")}
        </h2>
        <p className="mt-1 text-sm text-gray-500">{t("staff.subtitle")}</p>
      </div>

      <div className="rounded-lg border border-primary-100 bg-primary-50/60 p-4 text-sm text-gray-800">
        <p className="font-medium text-gray-900">
          {t("staff.inviteOnlyViaWorkspacesTitle")}
        </p>
        <p className="mt-2 text-gray-700">
          {t("staff.inviteOnlyViaWorkspacesBody")}
        </p>
        <Link
          href="/workspaces"
          className="mt-3 inline-block text-sm font-medium text-primary-700 underline hover:text-primary-900"
        >
          {t("staff.inviteGoToWorkspaces")}
        </Link>
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
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500"></th>
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
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {row.kind === "invite" ? (
                      <button
                        type="button"
                        onClick={() => handleRevokeInvite(row.id)}
                        disabled={revokingId === row.id}
                        className="rounded-md bg-red-50 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-100 disabled:opacity-50"
                      >
                        {revokingId === row.id ? "…" : t("staff.revokeInviteButton")}
                      </button>
                    ) : null}

                    {row.kind === "active" && row.role !== "admin" ? (
                      <button
                        type="button"
                        onClick={() => handleTransferAdmin(row.id)}
                        disabled={transferingId === row.id}
                        className="rounded-md bg-primary-100 px-3 py-1.5 text-xs font-medium text-primary-700 hover:bg-primary-200 disabled:opacity-50"
                      >
                        {transferingId === row.id ? "…" : t("staff.transferAdminButton")}
                      </button>
                    ) : null}

                    {row.kind === "active" && row.role === "admin" ? (
                      <button
                        type="button"
                        onClick={() => handleDemoteAdmin(row.id)}
                        disabled={demotingId === row.id}
                        className="rounded-md bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-700 hover:bg-amber-100 disabled:opacity-50"
                      >
                        {demotingId === row.id ? "…" : t("staff.demoteAdminButton")}
                      </button>
                    ) : null}
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


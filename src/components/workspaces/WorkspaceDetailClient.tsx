"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Pencil, Plus } from "lucide-react";
import type { WorkspaceMemberRole } from "@/types/database";
import {
  inviteToWorkspaceAction,
  revokeWorkspaceInviteAction,
  removeWorkspaceMemberAction,
  leaveWorkspaceAction,
  updateWorkspaceNameAction,
} from "@/app/actions/workspaces";
import { useApp } from "@/components/providers/AppProvider";
import { getT } from "@/lib/i18n";

export interface WorkspaceDetailInitial {
  workspace: { id: string; name: string };
  members: { user_id: string; email: string; full_name: string | null; role: WorkspaceMemberRole }[];
  invites: { id: string; email: string; created_at: string; token: string }[];
  canManage: boolean;
}

export function WorkspaceDetailClient({
  workspaceId,
  initial,
  currentUserId,
}: {
  workspaceId: string;
  initial: WorkspaceDetailInitial;
  currentUserId: string | null;
}) {
  const router = useRouter();
  const { lang } = useApp();
  const t = getT(lang);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<WorkspaceMemberRole>("member");
  const [busy, setBusy] = useState(false);
  const [lastToken, setLastToken] = useState<string | null>(null);
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState(initial.workspace.name);
  const [nameBusy, setNameBusy] = useState(false);

  useEffect(() => {
    setNameDraft(initial.workspace.name);
  }, [initial.workspace.name]);

  async function onInvite(e: React.FormEvent) {
    e.preventDefault();
    if (!inviteEmail.trim() || busy) return;
    setBusy(true);
    const { token, error } = await inviteToWorkspaceAction(workspaceId, inviteEmail, inviteRole);
    setBusy(false);
    if (error) {
      alert(error);
      return;
    }
    setLastToken(token);
    setInviteEmail("");
    router.refresh();
  }

  function inviteUrl(token: string) {
    if (typeof window === "undefined") return "";
    const u = new URL(window.location.origin + "/workspaces/join");
    u.searchParams.set("token", token);
    return u.toString();
  }

  async function onSaveWorkspaceName() {
    if (nameBusy) return;
    setNameBusy(true);
    const { error } = await updateWorkspaceNameAction(workspaceId, nameDraft);
    setNameBusy(false);
    if (error) {
      alert(error);
      return;
    }
    setEditingName(false);
    router.refresh();
  }

  async function copyInviteLink(token: string) {
    const url = inviteUrl(token);
    try {
      await navigator.clipboard.writeText(url);
      alert(t("workspaces.linkCopied"));
    } catch {
      window.prompt(t("workspaces.copyLink"), url);
    }
  }

  const isMember = currentUserId
    ? initial.members.some((m) => m.user_id === currentUserId)
    : false;

  return (
    <div className="space-y-8">
      <div className="no-print">
        <Link href="/workspaces" className="text-sm text-primary-600 hover:text-primary-800">
          ← {t("workspaces.backToList")}
        </Link>
      </div>

      {currentUserId && (
        <div className="card p-4 sm:p-5">
          <p className="text-sm text-gray-600">{t("workspaces.newProjectHereHint")}</p>
          <Link
            href={`/projects/new?workspace=${encodeURIComponent(workspaceId)}`}
            className="btn-primary mt-3 inline-flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            {t("workspaces.newProjectHere")}
          </Link>
        </div>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        {initial.canManage && editingName ? (
          <div className="flex w-full max-w-xl flex-col gap-2 sm:flex-row sm:items-center">
            <input
              type="text"
              className="input-base flex-1"
              value={nameDraft}
              onChange={(e) => setNameDraft(e.target.value)}
              disabled={nameBusy}
              autoFocus
              aria-label={t("workspaces.nameLabel")}
            />
            <div className="flex shrink-0 gap-2">
              <button type="button" className="btn-primary" onClick={onSaveWorkspaceName} disabled={nameBusy}>
                {t("common.save")}
              </button>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => {
                  setNameDraft(initial.workspace.name);
                  setEditingName(false);
                }}
                disabled={nameBusy}
              >
                {t("common.cancel")}
              </button>
            </div>
          </div>
        ) : (
          <h1 className="text-2xl font-semibold text-gray-900">{initial.workspace.name}</h1>
        )}
        {initial.canManage && (
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            {!editingName && (
              <button
                type="button"
                onClick={() => setEditingName(true)}
                className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-gray-900"
              >
                <Pencil className="h-4 w-4" />
                {t("workspaces.renameWorkspace")}
              </button>
            )}
          </div>
        )}
      </div>

      {initial.canManage && (
        <div className="card p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">{t("workspaces.inviteButton")}</h2>
          <p className="text-sm text-gray-500">{t("workspaces.inviteHint")}</p>
          <form onSubmit={onInvite} className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
            <div className="min-w-[200px] flex-1">
              <label className="block text-sm font-medium text-gray-700">{t("workspaces.inviteEmail")}</label>
              <input
                type="email"
                className="input-base mt-1 w-full"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                autoComplete="email"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">{t("workspaces.inviteRole")}</label>
              <select
                className="input-base mt-1"
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value as WorkspaceMemberRole)}
              >
                <option value="member">{t("workspaces.roleMember")}</option>
                <option value="admin">{t("workspaces.roleAdmin")}</option>
              </select>
            </div>
            <button type="submit" disabled={busy || !inviteEmail.trim()} className="btn-primary shrink-0">
              {t("workspaces.inviteButton")}
            </button>
          </form>
          {lastToken && (
            <div className="rounded-md bg-gray-50 p-3 text-sm">
              <button
                type="button"
                className="btn-secondary text-xs"
                onClick={() => copyInviteLink(lastToken)}
              >
                {t("workspaces.copyLink")}
              </button>
            </div>
          )}
        </div>
      )}

      <div className="card p-6">
        <h2 className="text-lg font-semibold text-gray-900">{t("workspaces.members")}</h2>
        <ul className="mt-3 divide-y divide-gray-100">
          {initial.members.map((m) => (
            <li key={m.user_id} className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm">
              <div>
                <span className="font-medium text-gray-900">{m.full_name || m.email}</span>
                <span className="ml-2 text-gray-500">{m.email}</span>
                <span className="ml-2 rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-700">
                  {m.role === "admin" ? t("workspaces.roleAdmin") : t("workspaces.roleMember")}
                </span>
              </div>
              {initial.canManage && m.user_id !== currentUserId && (
                <button
                  type="button"
                  className="text-xs text-red-600 hover:text-red-800"
                  onClick={async () => {
                    if (!confirm(t("workspaces.removeMemberConfirm"))) return;
                    const { error } = await removeWorkspaceMemberAction(workspaceId, m.user_id);
                    if (error) alert(error);
                    else router.refresh();
                  }}
                >
                  {t("workspaces.removeMember")}
                </button>
              )}
            </li>
          ))}
        </ul>
      </div>

      {initial.canManage && initial.invites.length > 0 && (
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-gray-900">{t("workspaces.invites")}</h2>
          <ul className="mt-3 divide-y divide-gray-100">
            {initial.invites.map((inv) => (
              <li key={inv.id} className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm">
                <span>{inv.email}</span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    className="text-xs text-primary-600 hover:text-primary-800"
                    onClick={() => copyInviteLink(inv.token)}
                  >
                    {t("workspaces.copyLink")}
                  </button>
                  <button
                    type="button"
                    className="text-xs text-red-600 hover:text-red-800"
                    onClick={async () => {
                      const { error } = await revokeWorkspaceInviteAction(inv.id);
                      if (error) alert(error);
                      else router.refresh();
                    }}
                  >
                    {t("workspaces.revokeInvite")}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {isMember && currentUserId && (
        <div className="card border-red-100 bg-red-50/40 p-6">
          <button
            type="button"
            className="text-sm font-medium text-red-700 hover:text-red-900"
            onClick={async () => {
              if (!confirm(t("workspaces.leaveConfirm"))) return;
              const { error } = await leaveWorkspaceAction(workspaceId);
              if (error) alert(error);
              else {
                router.push("/workspaces");
                router.refresh();
              }
            }}
          >
            {t("workspaces.leave")}
          </button>
        </div>
      )}
    </div>
  );
}

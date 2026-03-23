"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/components/providers/AppProvider";
import { getT } from "@/lib/i18n";

export function CreateWorkspaceCard() {
  const router = useRouter();
  const { lang } = useApp();
  const t = getT(lang);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed || loading) return;
    setLoading(true);
    const res = await fetch("/api/workspaces/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: trimmed }),
    });
    const data = (await res.json().catch(() => ({}))) as {
      id?: string | null;
      error?: string | null;
    };
    setLoading(false);
    if (!res.ok || data.error) {
      alert(data.error ?? "Fehler.");
      return;
    }
    const id = data.id;
    setName("");
    router.refresh();
    if (id) router.push(`/workspaces/${id}`);
  }

  return (
    <div className="card p-6">
      <h2 className="text-lg font-semibold text-gray-900">{t("workspaces.createTitle")}</h2>
      <form onSubmit={onSubmit} className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700">{t("workspaces.nameLabel")}</label>
          <input
            className="input-base mt-1 w-full"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="…"
          />
        </div>
        <button type="submit" disabled={loading || !name.trim()} className="btn-primary shrink-0">
          {loading ? t("workspaces.creating") : t("workspaces.createButton")}
        </button>
      </form>
    </div>
  );
}

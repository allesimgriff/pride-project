"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { updateWorkspaceCategoryAction } from "@/app/actions/categories";
import { normalizeCategoryPrefix } from "@/lib/categoryPrefix";
import { useApp } from "@/components/providers/AppProvider";
import { getT } from "@/lib/i18n";

export type WorkspaceCategoryRow = {
  id: string;
  name: string;
  prefix: string;
  sort_order: number;
  workspace_id: string;
};

export function WorkspaceCategoryEditor({
  workspaceId,
  categories,
  selectedPrefix,
  canManage,
  onSaved,
}: {
  workspaceId: string;
  categories: WorkspaceCategoryRow[];
  selectedPrefix: string;
  canManage: boolean;
  /** Nach Speichern (z. B. Präfix geändert): Formular-Kategorie aktualisieren. */
  onSaved?: (newPrefix: string) => void;
}) {
  const router = useRouter();
  const { lang } = useApp();
  const t = getT(lang);
  const row = categories.find((c) => c.prefix === selectedPrefix) ?? categories[0];
  const [name, setName] = useState(row?.name ?? "");
  const [prefix, setPrefix] = useState(row?.prefix ?? "");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const r = categories.find((c) => c.prefix === selectedPrefix) ?? categories[0];
    if (r) {
      setName(r.name);
      setPrefix(r.prefix);
    }
  }, [categories, selectedPrefix]);

  if (!categories.length || !canManage || !row) return null;

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    const n = name.trim();
    const p = normalizeCategoryPrefix(prefix);
    if (!n || !p) {
      alert(t("categoryEditor.fillBoth"));
      return;
    }
    setSaving(true);
    const { error } = await updateWorkspaceCategoryAction({
      workspaceId,
      categoryId: row.id,
      name: n,
      prefix: p,
    });
    setSaving(false);
    if (error) {
      alert(error);
      return;
    }
    setPrefix(p);
    onSaved?.(p);
    router.refresh();
  }

  return (
    <div className="mt-3 rounded-md border border-gray-100 bg-gray-50/80 p-3">
      <p className="text-xs text-gray-600">{t("categoryEditor.hint")}</p>
      <div className="mt-2 grid gap-2 sm:grid-cols-2">
        <div>
          <label className="block text-xs font-medium text-gray-600">{t("categoryEditor.name")}</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="input-base mt-0.5 w-full text-sm"
            disabled={saving}
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600">{t("categoryEditor.prefix")}</label>
          <input
            value={prefix}
            onChange={(e) => setPrefix(e.target.value)}
            className="input-base mt-0.5 w-full font-mono text-sm"
            disabled={saving}
            spellCheck={false}
          />
        </div>
      </div>
      <button type="button" className="btn-secondary mt-2 text-xs" disabled={saving} onClick={handleSave}>
        {saving ? "…" : t("categoryEditor.save")}
      </button>
    </div>
  );
}

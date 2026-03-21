"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  saveWorkspaceProjectLabelAction,
  deleteWorkspaceProjectLabelOverrideAction,
} from "@/app/actions/workspaceProjectLabels";
import type { ProjectLabelRow } from "@/lib/projectLabelDefaults";
import { useApp } from "@/components/providers/AppProvider";
import { getT } from "@/lib/i18n";

const KEY_LABELS: Record<string, { de: string; en: string }> = {
  category: { de: "Kategorie", en: "Category" },
  devNumber: { de: "Entwicklungsnummer", en: "Dev number" },
  productName: { de: "Produktname", en: "Product name" },
  status: { de: "Status", en: "Status" },
  description: { de: "Beschreibung", en: "Description" },
  files: { de: "Dateien", en: "Files" },
  technicalNotes: { de: "Technische Merkmale", en: "Technical details" },
  functions: { de: "Funktionen", en: "Functions" },
  materials: { de: "Materialien", en: "Materials" },
  openPoints: { de: "Offene Punkte", en: "Open points" },
};

export function WorkspaceProjectLabelsManager({
  workspaceId,
  workspaceName,
  labels,
}: {
  workspaceId: string;
  workspaceName: string;
  labels: ProjectLabelRow[];
}) {
  const router = useRouter();
  const { lang } = useApp();
  const t = getT(lang);
  const [rows, setRows] = useState(labels);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [resettingKey, setResettingKey] = useState<string | null>(null);

  async function saveRow(row: ProjectLabelRow) {
    setSavingKey(row.key);
    const result = await saveWorkspaceProjectLabelAction({
      workspaceId,
      key: row.key,
      label_de: row.label_de,
      label_en: row.label_en,
    }).catch((e) => ({ error: e instanceof Error ? e.message : String(e) }));
    setSavingKey(null);
    if (result?.error) {
      alert(result.error);
      return;
    }
    router.refresh();
  }

  async function resetRow(row: ProjectLabelRow) {
    if (!confirm(t("workspaces.labelsResetConfirm"))) return;
    setResettingKey(row.key);
    const result = await deleteWorkspaceProjectLabelOverrideAction({
      workspaceId,
      key: row.key,
    }).catch((e) => ({ error: e instanceof Error ? e.message : String(e) }));
    setResettingKey(null);
    if (result?.error) {
      alert(result.error);
      return;
    }
    router.refresh();
  }

  return (
    <div className="card p-6">
      <p className="mb-4 text-sm font-medium text-gray-900">{workspaceName}</p>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                {lang === "de" ? "Feld (Hinweis)" : "Field (hint)"}
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Deutsch</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">English</th>
              <th className="px-4 py-3 text-right text-xs font-medium uppercase text-gray-500">
                {t("workspaces.labelsActions")}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {rows.map((row, idx) => (
              <tr key={row.key}>
                <td className="px-4 py-3 text-sm text-gray-700">
                  {KEY_LABELS[row.key]
                    ? `${KEY_LABELS[row.key].de} / ${KEY_LABELS[row.key].en}`
                    : row.key}
                </td>
                <td className="px-4 py-3">
                  <input
                    value={row.label_de}
                    onChange={(e) =>
                      setRows((prev) =>
                        prev.map((r, i) => (i === idx ? { ...r, label_de: e.target.value } : r)),
                      )
                    }
                    className="input-base w-full"
                  />
                </td>
                <td className="px-4 py-3">
                  <input
                    value={row.label_en}
                    onChange={(e) =>
                      setRows((prev) =>
                        prev.map((r, i) => (i === idx ? { ...r, label_en: e.target.value } : r)),
                      )
                    }
                    className="input-base w-full"
                  />
                </td>
                <td className="px-4 py-3 text-right whitespace-nowrap space-x-2">
                  <button
                    type="button"
                    onClick={() => saveRow(row)}
                    disabled={savingKey === row.key}
                    className="btn-primary text-xs"
                  >
                    {savingKey === row.key ? "…" : t("workspaces.labelsSave")}
                  </button>
                  <button
                    type="button"
                    onClick={() => resetRow(row)}
                    disabled={resettingKey === row.key}
                    className="btn-secondary text-xs"
                  >
                    {resettingKey === row.key ? "…" : t("workspaces.labelsReset")}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

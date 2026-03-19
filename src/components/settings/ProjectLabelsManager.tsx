"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { saveProjectLabelAction } from "@/app/actions/projectLabels";
import type { ProjectLabelRow } from "@/lib/projectLabelDefaults";
import { useApp } from "@/components/providers/AppProvider";

interface ProjectLabelsManagerProps {
  labels: ProjectLabelRow[];
}

export function ProjectLabelsManager({ labels }: ProjectLabelsManagerProps) {
  const router = useRouter();
  const { lang } = useApp();
  const [rows, setRows] = useState(labels);
  const [savingKey, setSavingKey] = useState<string | null>(null);

  const keyLabelMap: Record<string, { de: string; en: string }> = {
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

  async function saveRow(row: ProjectLabelRow) {
    setSavingKey(row.key);
    const result = await saveProjectLabelAction({
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

  return (
    <div className="card p-6">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Projekt-Überschriften</h2>
        <p className="mt-1 text-sm text-gray-500">Hier definierst du die Standard-Überschriften im Projektbereich.</p>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                {lang === "de" ? "Schlüssel (DE/EN)" : "Key (DE/EN)"}
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Deutsch</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">English</th>
              <th className="px-4 py-3 text-right text-xs font-medium uppercase text-gray-500">Aktion</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {rows.map((row, idx) => (
              <tr key={row.key}>
                <td className="px-4 py-3 text-sm text-gray-700">
                  {keyLabelMap[row.key]
                    ? `${keyLabelMap[row.key].de} / ${keyLabelMap[row.key].en}`
                    : row.key}
                </td>
                <td className="px-4 py-3">
                  <input
                    value={row.label_de}
                    onChange={(e) =>
                      setRows((prev) =>
                        prev.map((r, i) => (i === idx ? { ...r, label_de: e.target.value } : r))
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
                        prev.map((r, i) => (i === idx ? { ...r, label_en: e.target.value } : r))
                      )
                    }
                    className="input-base w-full"
                  />
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    type="button"
                    onClick={() => saveRow(row)}
                    disabled={savingKey === row.key}
                    className="btn-primary"
                  >
                    {savingKey === row.key ? "Speichern..." : "Speichern"}
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


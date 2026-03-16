"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Project } from "@/types/database";
import type { ProjectStatus } from "@/types/database";
import { updateProjectAction } from "@/app/actions/projects";
import { Pencil, Check, X } from "lucide-react";
import { useApp } from "@/components/providers/AppProvider";
import { getT } from "@/lib/i18n";

const STATUSES: ProjectStatus[] = [
  "idee",
  "konzept",
  "entwicklung",
  "muster",
  "freigabe",
  "abgeschlossen",
  "archiviert",
];

interface ProjectStammdatenProps {
  project: Project;
  categories: { name: string; prefix: string }[];
}

function getCategoryDisplay(category: string | null, categories: { name: string; prefix: string }[]) {
  if (!category) return "—";
  const c = categories.find((x) => x.prefix === category);
  return c ? `${c.name} (${c.prefix})` : category;
}

export function ProjectStammdaten({ project, categories }: ProjectStammdatenProps) {
  const router = useRouter();
  const { lang } = useApp();
  const t = getT(lang);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const td = (project.technical_data as { technical_notes?: string }) || {};
  const [form, setForm] = useState({
    product_name: project.product_name,
    category: project.category ?? "",
    status: project.status,
    description: project.description ?? "",
    technical_notes: td.technical_notes ?? "",
    functions: project.functions ?? "",
    materials: project.materials ?? "",
    target_price: project.target_price ?? "",
    open_points: project.open_points ?? "",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const technical_data = form.technical_notes
      ? { technical_notes: form.technical_notes }
      : {};
    const result = await updateProjectAction(project.id, {
      product_name: form.product_name,
      category: form.category || null,
      status: form.status,
      description: form.description || null,
      technical_data,
      functions: form.functions || null,
      materials: form.materials || null,
      target_price: form.target_price ? Number(form.target_price) : null,
      open_points: form.open_points || null,
    });
    setLoading(false);
    if (result?.error) {
      alert(result.error);
      return;
    }
    setEditing(false);
    router.refresh();
  }

  function handleCancel() {
    const t = (project.technical_data as { technical_notes?: string }) || {};
    setForm({
      product_name: project.product_name,
      category: project.category ?? "",
      status: project.status,
      description: project.description ?? "",
      technical_notes: t.technical_notes ?? "",
      functions: project.functions ?? "",
      materials: project.materials ?? "",
      target_price: project.target_price ?? "",
      open_points: project.open_points ?? "",
    });
    setEditing(false);
  }

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">{t("stammdaten.title")}</h2>
        {!editing ? (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-100"
          >
            <Pencil className="h-4 w-4" />
            {t("stammdaten.edit")}
          </button>
        ) : (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleCancel}
              className="inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-100"
            >
              <X className="h-4 w-4" />
              {t("stammdaten.cancel")}
            </button>
            <button
              type="submit"
              form="stammdaten-form"
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-md bg-primary-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-primary-700"
            >
              <Check className="h-4 w-4" />
              {loading ? t("stammdaten.saving") : t("stammdaten.save")}
            </button>
          </div>
        )}
      </div>

      <form id="stammdaten-form" onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              {t("stammdaten.productName")}
            </label>
            {editing ? (
              <input
                value={form.product_name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, product_name: e.target.value }))
                }
                className="input-base mt-1"
                required
              />
            ) : (
              <p className="mt-1 text-sm text-gray-900">{project.product_name}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              {t("stammdaten.devNumber")}
            </label>
            <p className="mt-1 text-sm text-gray-900">{project.dev_number}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              {t("stammdaten.category")}
            </label>
            {editing ? (
              <select
                value={form.category}
                onChange={(e) =>
                  setForm((f) => ({ ...f, category: e.target.value }))
                }
                className="input-base mt-1"
              >
                <option value="">{t("common.select")}</option>
                {categories.map((c) => (
                  <option key={c.prefix} value={c.prefix}>
                    {c.name} ({c.prefix})
                  </option>
                ))}
              </select>
            ) : (
              <p className="mt-1 text-sm text-gray-900">
                {getCategoryDisplay(project.category, categories)}
              </p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              {t("stammdaten.status")}
            </label>
            {editing ? (
              <select
                value={form.status}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    status: e.target.value as ProjectStatus,
                  }))
                }
                className="input-base mt-1"
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {t(`status.${s}`)}
                  </option>
                ))}
              </select>
            ) : (
              <p className="mt-1 text-sm text-gray-900">
                {t(`status.${project.status}`)}
              </p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              {t("stammdaten.targetPrice")}
            </label>
            {editing ? (
              <input
                type="number"
                step="0.01"
                value={form.target_price}
                onChange={(e) =>
                  setForm((f) => ({ ...f, target_price: e.target.value }))
                }
                className="input-base mt-1"
              />
            ) : (
              <p className="mt-1 text-sm text-gray-900">
                {project.target_price != null
                  ? `${Number(project.target_price).toLocaleString("de-DE")} €`
                  : "—"}
              </p>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            {t("stammdaten.description")}
          </label>
          {editing ? (
            <textarea
              value={form.description}
              onChange={(e) =>
                setForm((f) => ({ ...f, description: e.target.value }))
              }
              rows={3}
              className="input-base mt-1"
            />
          ) : (
            <p className="mt-1 whitespace-pre-wrap text-sm text-gray-900">
              {project.description ?? "—"}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            {t("stammdaten.technicalNotes")}
          </label>
          {editing ? (
            <textarea
              value={form.technical_notes}
              onChange={(e) =>
                setForm((f) => ({ ...f, technical_notes: e.target.value }))
              }
              rows={3}
              className="input-base mt-1"
              placeholder={t("stammdaten.technicalNotesPlaceholder")}
            />
          ) : (
            <p className="mt-1 whitespace-pre-wrap text-sm text-gray-900">
              {(project.technical_data as { technical_notes?: string })?.technical_notes ?? "—"}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            {t("stammdaten.functions")}
          </label>
          {editing ? (
            <textarea
              value={form.functions}
              onChange={(e) =>
                setForm((f) => ({ ...f, functions: e.target.value }))
              }
              rows={2}
              className="input-base mt-1"
            />
          ) : (
            <p className="mt-1 whitespace-pre-wrap text-sm text-gray-900">
              {project.functions ?? "—"}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            {t("stammdaten.materials")}
          </label>
          {editing ? (
            <textarea
              value={form.materials}
              onChange={(e) =>
                setForm((f) => ({ ...f, materials: e.target.value }))
              }
              rows={2}
              className="input-base mt-1"
            />
          ) : (
            <p className="mt-1 whitespace-pre-wrap text-sm text-gray-900">
              {project.materials ?? "—"}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            {t("stammdaten.openPoints")}
          </label>
          {editing ? (
            <textarea
              value={form.open_points}
              onChange={(e) =>
                setForm((f) => ({ ...f, open_points: e.target.value }))
              }
              rows={3}
              className="input-base mt-1"
            />
          ) : (
            <p className="mt-1 whitespace-pre-wrap text-sm text-gray-900">
              {project.open_points ?? "—"}
            </p>
          )}
        </div>
      </form>
    </div>
  );
}

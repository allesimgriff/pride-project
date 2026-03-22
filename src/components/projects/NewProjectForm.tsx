"use client";

import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createProjectAction } from "@/app/actions/projects";
import {
  canManageWorkspaceCategoriesAction,
  getNextDevNumberAction,
} from "@/app/actions/categories";
import type { ProjectStatus } from "@/types/database";
import { createClient } from "@/lib/supabase/client";
import { useApp } from "@/components/providers/AppProvider";
import { getT } from "@/lib/i18n";
import { type ProjectLabelMap, projectLabelRowsToMap } from "@/lib/projectLabelDefaults";
import {
  canEditWorkspaceLabelsForWorkspaceAction,
  listMergedProjectLabelsForWorkspaceAction,
} from "@/app/actions/workspaceProjectLabels";
import { EditableProjectLabel } from "@/components/projects/EditableProjectLabel";
import { WorkspaceCategoryEditor } from "@/components/projects/WorkspaceCategoryEditor";
import type { ProjectLabelKey } from "@/lib/projectLabelDefaults";

interface NewProjectFormProps {
  workspaces: { id: string; name: string }[];
  categories: {
    id: string;
    name: string;
    prefix: string;
    sort_order: number;
    workspace_id: string;
  }[];
  canEdit: boolean;
  projectLabels: ProjectLabelMap;
  /** Aus `/projects/new?workspace=…` — Workspace-Dropdown vorauswählen. */
  initialWorkspaceId?: string | null;
  /** Server-seitig: sofort Stift/Inline-Edit ohne Warten auf Client-Permission-Call. */
  initialCanEditLabels?: boolean;
}

const STATUSES: ProjectStatus[] = [
  "idee",
  "konzept",
  "entwicklung",
  "muster",
  "freigabe",
  "abgeschlossen",
  "archiviert",
];

export function NewProjectForm({
  workspaces,
  categories,
  canEdit,
  projectLabels: initialProjectLabels,
  initialWorkspaceId = null,
  initialCanEditLabels = false,
}: NewProjectFormProps) {
  const router = useRouter();
  const { lang } = useApp();
  const t = getT(lang);
  const [projectLabels, setProjectLabels] = useState<ProjectLabelMap>(initialProjectLabels);
  const [loading, setLoading] = useState(false);
  const [loadingNumber, setLoadingNumber] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [initialTasks, setInitialTasks] = useState<
    { id: number; text: string; completed: boolean }[]
  >([]);
  const [nextTaskId, setNextTaskId] = useState(1);
  const skipInitialLabelFetch = useRef(true);
  const [canEditLabels, setCanEditLabels] = useState(initialCanEditLabels);
  const [canManageCategories, setCanManageCategories] = useState(false);

  function onLabelMapUpdate(key: ProjectLabelKey, de: string, en: string) {
    setProjectLabels((prev) => ({ ...prev, [key]: { de, en } }));
  }

  const labelNrTitle =
    lang === "de"
      ? "Entspricht der Spalte „Nr.“ unter Überschriften für diesen Workspace"
      : "Matches the “Nr.” column under headings for this workspace";

  const [workspaceId, setWorkspaceId] = useState(() => {
    if (initialWorkspaceId && workspaces.some((w) => w.id === initialWorkspaceId)) {
      return initialWorkspaceId;
    }
    return workspaces[0]?.id ?? "";
  });

  const wsCats = useMemo(() => {
    return categories
      .filter((c) => c.workspace_id === workspaceId)
      .sort((a, b) => a.sort_order - b.sort_order);
  }, [categories, workspaceId]);

  const [form, setForm] = useState({
    dev_number: "",
    product_name: "",
    category: "",
    status: "idee" as ProjectStatus,
    description: "",
    technical_notes: "",
    functions: "",
    materials: "",
    open_points: "",
  });

  useEffect(() => {
    if (workspaces.length === 0) return;
    if (!workspaceId || !workspaces.some((w) => w.id === workspaceId)) {
      setWorkspaceId(workspaces[0].id);
    }
  }, [workspaces, workspaceId]);

  useEffect(() => {
    if (!workspaceId) {
      setCanEditLabels(false);
      setCanManageCategories(false);
      return;
    }
    let cancelled = false;
    (async () => {
      const [{ canEdit }, { canEdit: canCat }] = await Promise.all([
        canEditWorkspaceLabelsForWorkspaceAction(workspaceId),
        canManageWorkspaceCategoriesAction(workspaceId),
      ]);
      if (!cancelled) {
        setCanEditLabels(canEdit);
        setCanManageCategories(canCat);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [workspaceId]);

  useEffect(() => {
    if (!workspaceId) return;
    if (skipInitialLabelFetch.current) {
      skipInitialLabelFetch.current = false;
      return;
    }
    let cancelled = false;
    (async () => {
      const { data, error } = await listMergedProjectLabelsForWorkspaceAction(workspaceId);
      if (cancelled || error || !data) return;
      setProjectLabels(projectLabelRowsToMap(data));
    })();
    return () => {
      cancelled = true;
    };
  }, [workspaceId]);

  const refreshDevNumber = useCallback(async (prefix: string, wsId: string) => {
    if (!prefix || !wsId) return;
    setLoadingNumber(true);
    const { devNumber } = await getNextDevNumberAction(prefix, wsId);
    setLoadingNumber(false);
    setForm((f) => ({ ...f, dev_number: devNumber }));
  }, []);

  useEffect(() => {
    if (!workspaceId || wsCats.length !== 1) return;
    const p = wsCats[0].prefix;
    setForm((f) => (f.category === p ? f : { ...f, category: p }));
    void refreshDevNumber(p, workspaceId);
  }, [workspaceId, wsCats, refreshDevNumber]);

  async function onCategoryChange(prefix: string) {
    setForm((f) => ({ ...f, category: prefix }));
    if (!prefix) return;
    await refreshDevNumber(prefix, workspaceId);
  }

  async function onWorkspaceChange(wsId: string) {
    setWorkspaceId(wsId);
    setForm((f) => ({ ...f, category: "" }));
  }

  function renderLabel(key: ProjectLabelKey, fallback: string) {
    return (
      <EditableProjectLabel
        labelKey={key}
        fallback={fallback}
        workspaceId={workspaceId || null}
        projectLabels={projectLabels}
        canEdit={canEditLabels}
        showNr
        nrTitle={labelNrTitle}
        onMapUpdate={onLabelMapUpdate}
      />
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canEdit) {
      alert(
        lang === "de"
          ? "Keine Berechtigung zum Anlegen von Projekten."
          : "You are not allowed to create projects."
      );
      return;
    }
    if (!workspaceId) {
      alert(lang === "de" ? "Bitte einen Workspace wählen." : "Please choose a workspace.");
      return;
    }
    if (wsCats.length > 0 && !form.category.trim()) {
      alert(lang === "de" ? "Bitte eine Kategorie wählen." : "Please select a category.");
      return;
    }
    setLoading(true);
    const technical_data = {
      technical_notes: form.technical_notes || undefined,
    };
    const result = await createProjectAction({
      workspace_id: workspaceId,
      dev_number: form.dev_number,
      product_name: form.product_name,
      category: form.category || null,
      status: form.status,
      description: form.description || null,
      technical_data,
      functions: form.functions || null,
      materials: form.materials || null,
      open_points: form.open_points || null,
    });
    if (result?.error || !result?.id) {
      setLoading(false);
      alert(result.error);
      return;
    }

    // Beim Anlegen ausgewählte Dateien hochladen
    const files = uploadingFiles;
    if (files.length > 0) {
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
          for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const path = `${result.id}/${crypto.randomUUID()}_${file.name}`;
            const { error: uploadError } = await supabase.storage
              .from("project-files")
              .upload(path, file, { upsert: false });
            if (uploadError) {
              alert(`Fehler beim Hochladen von ${file.name}: ${uploadError.message}`);
              continue;
            }
            const { error: insertError } = await supabase.from("project_files").insert({
              project_id: result.id,
              uploaded_by: user.id,
              file_name: file.name,
              file_path: path,
              file_size: file.size,
              mime_type: file.type,
            });
            if (insertError) {
              alert(`Fehler beim Speichern von ${file.name}: ${insertError.message}`);
            }
          }
        }
      } catch (err) {
        console.error(err);
      }
    }

    // Anfangsaufgaben mit Kästchen als einfache Tasks speichern
    if (initialTasks.length > 0) {
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
          const tasksToInsert = initialTasks
            .filter((task) => task.text.trim().length > 0)
            .map((task) => ({
              project_id: result.id,
              title: task.text.trim(),
              description: null,
              responsible_id: user.id,
              priority: "mittel" as const,
              due_date: null,
              created_by: user.id,
              completed: task.completed,
              completed_at: task.completed ? new Date().toISOString() : null,
            }));

          if (tasksToInsert.length > 0) {
            const { error: tasksError } = await supabase
              .from("project_tasks")
              .insert(tasksToInsert);
            if (tasksError) {
              console.error(tasksError);
              alert(
                lang === "de"
                  ? "Die Aufgaben beim Anlegen konnten nicht vollständig gespeichert werden."
                  : "Some initial tasks could not be saved."
              );
            }
          }
        }
      } catch (err) {
        console.error(err);
      }
    }

    setLoading(false);
    setUploadingFiles([]);
    setInitialTasks([]);
    if (fileInputRef.current) fileInputRef.current.value = "";

    router.push(`/projects/${result.id}`);
    router.refresh();
  }

  return (
    <div className="card p-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        <p className="text-xs text-gray-500">{t("newProject.formIntroHint")}</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700">{t("newProject.workspace")}</label>
            <select
              value={workspaceId}
              onChange={(e) => onWorkspaceChange(e.target.value)}
              className="input-base mt-1"
              disabled={!canEdit || workspaces.length === 0}
              required
            >
              <option value="">{t("newProject.workspacePlaceholder")}</option>
              {workspaces.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name}
                </option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700">
              {renderLabel("category", t("newProject.category"))}
            </label>
            {wsCats.length > 0 ? (
              <>
                <select
                  value={form.category}
                  onChange={(e) => onCategoryChange(e.target.value)}
                  className="input-base mt-1"
                  disabled={!canEdit || wsCats.length === 1}
                  required={wsCats.length > 0}
                >
                  <option value="">{t("newProject.categorySelectPlaceholder")}</option>
                  {wsCats.map((c) => (
                    <option key={c.id} value={c.prefix}>
                      {c.name}
                    </option>
                  ))}
                </select>
                {canManageCategories && wsCats.length > 0 && (wsCats.length === 1 || Boolean(form.category)) ? (
                  <WorkspaceCategoryEditor
                    workspaceId={workspaceId}
                    categories={wsCats}
                    selectedPrefix={form.category || wsCats[0].prefix}
                    canManage={canManageCategories}
                    onSaved={(newPrefix) => {
                      setForm((f) => ({ ...f, category: newPrefix }));
                      void refreshDevNumber(newPrefix, workspaceId);
                    }}
                  />
                ) : null}
              </>
            ) : (
              <p className="mt-1 text-sm text-amber-800">{t("newProject.noCategoriesInWorkspace")}</p>
            )}
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700">
              {renderLabel("devNumber", t("newProject.devNumber"))}
            </label>
            <input
              value={form.dev_number}
              onChange={(e) =>
                setForm((f) => ({ ...f, dev_number: e.target.value }))
              }
              className="input-base mt-1 font-mono"
              required
              placeholder={t("newProject.categoryPlaceholder")}
              readOnly={loadingNumber}
              disabled={!canEdit}
            />
            {loadingNumber && <p className="mt-1 text-xs text-gray-500">{t("newProject.numberSuggesting")}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              <span className="inline-flex flex-wrap items-center gap-1">
                {renderLabel("productName", t("newProject.productName"))}
                <span aria-hidden>*</span>
              </span>
            </label>
            <input
              value={form.product_name}
              onChange={(e) =>
                setForm((f) => ({ ...f, product_name: e.target.value }))
              }
              className="input-base mt-1"
              required
              disabled={!canEdit}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">{renderLabel("status", t("newProject.status"))}</label>
            <select
              value={form.status}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  status: e.target.value as ProjectStatus,
                }))
              }
              className="input-base mt-1"
              disabled={!canEdit}
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {t(`status.${s}`)}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            {renderLabel("description", t("newProject.description"))}
          </label>
          <textarea
            value={form.description}
            onChange={(e) =>
              setForm((f) => ({ ...f, description: e.target.value }))
            }
            rows={3}
            className="input-base mt-1"
            disabled={!canEdit}
          />
        </div>
        {/* Dateien schon beim Anlegen auswählen */}
        <div>
          <label className="block text-sm font-medium text-gray-700">{renderLabel("files", t("files.title"))}</label>
          <p className="mt-1 text-xs text-gray-500">{t("files.hint")}</p>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={(e) => {
              const list = e.target.files;
              if (!list) return;
              const files = Array.from(list);
              setUploadingFiles((prev) => [...prev, ...files]);
              // Input zurücksetzen, damit onChange auch bei erneuter Auswahl derselben Datei wieder ausgelöst wird
              e.target.value = "";
            }}
            className="mt-1 block w-full text-sm text-gray-500 file:mr-2 file:rounded file:border-0 file:bg-primary-50 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-primary-700 hover:file:bg-primary-100"
            disabled={!canEdit}
          />
          {uploadingFiles.length > 0 && (
            <ul className="mt-2 space-y-1 text-xs text-gray-600">
              {uploadingFiles.map((file, idx) => (
                <li key={`${file.name}-${idx}`} className="flex items-center justify-between">
                  <span className="truncate">{file.name}</span>
                  <span className="ml-2 shrink-0 text-gray-400">
                    {(file.size / 1024).toFixed(1)} KB
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            {renderLabel("technicalNotes", t("newProject.technicalNotes"))}
          </label>
          <textarea
            value={form.technical_notes}
            onChange={(e) =>
              setForm((f) => ({ ...f, technical_notes: e.target.value }))
            }
            rows={2}
            className="input-base mt-1"
            placeholder={t("newProject.technicalNotesPlaceholder")}
            disabled={!canEdit}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">{renderLabel("functions", t("newProject.functions"))}</label>
          <textarea
            value={form.functions}
            onChange={(e) =>
              setForm((f) => ({ ...f, functions: e.target.value }))
            }
            rows={2}
            className="input-base mt-1"
            disabled={!canEdit}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">{renderLabel("materials", t("newProject.materials"))}</label>
          <textarea
            value={form.materials}
            onChange={(e) =>
              setForm((f) => ({ ...f, materials: e.target.value }))
            }
            rows={2}
            className="input-base mt-1"
            disabled={!canEdit}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">{renderLabel("openPoints", t("newProject.openPoints"))}</label>
          <textarea
            value={form.open_points}
            onChange={(e) =>
              setForm((f) => ({ ...f, open_points: e.target.value }))
            }
            rows={2}
            className="input-base mt-1"
            disabled={!canEdit}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            {lang === "de" ? "Aufgaben beim Anlegen" : "Initial tasks for this project"}
          </label>
          <p className="mt-1 text-xs text-gray-500">
            {lang === "de"
              ? "Füge einfache Aufgaben mit Kästchen hinzu. Nur du kannst sie später abhaken; das Entfernen eines Hakens erfordert eine Bestätigung."
              : "Add simple checklist tasks. Only you can toggle them later; removing a checkmark requires confirmation."}
          </p>
          <div className="mt-2 space-y-2">
            {initialTasks.map((task) => (
              <div
                key={task.id}
                className="flex items-center gap-2 rounded border border-gray-200 bg-gray-50 px-3 py-2"
              >
                <input
                  type="checkbox"
                  checked={task.completed}
                  onChange={() => {
                    if (task.completed) {
                      const confirmText =
                        lang === "de"
                          ? "Möchten Sie dieses Kästchen wirklich wieder als offen markieren?"
                          : "Do you really want to uncheck this item?";
                      if (!confirm(confirmText)) return;
                    }
                    setInitialTasks((items) =>
                      items.map((it) =>
                        it.id === task.id ? { ...it, completed: !it.completed } : it
                      )
                    );
                  }}
                  className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  disabled={!canEdit}
                />
                <input
                  type="text"
                  value={task.text}
                  onChange={(e) =>
                    setInitialTasks((items) =>
                      items.map((it) =>
                        it.id === task.id ? { ...it, text: e.target.value } : it
                      )
                    )
                  }
                  className="input-base flex-1 text-sm"
                  placeholder={
                    lang === "de"
                      ? "Aufgabe oder Entwicklungsschritt"
                      : "Task or development step"
                  }
                  disabled={!canEdit}
                />
                <button
                  type="button"
                  onClick={() =>
                    setInitialTasks((items) => items.filter((it) => it.id !== task.id))
                  }
                  className="text-xs text-gray-400 hover:text-red-600"
                  disabled={!canEdit}
                >
                  {lang === "de" ? "Entfernen" : "Remove"}
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => {
                setInitialTasks((items) => [
                  ...items,
                  { id: nextTaskId, text: "", completed: false },
                ]);
                setNextTaskId((id) => id + 1);
              }}
              className="inline-flex items-center rounded-md border border-dashed border-gray-300 px-3 py-2 text-sm text-gray-600 hover:border-primary-300 hover:text-primary-700"
              disabled={!canEdit}
            >
              {lang === "de" ? "Zelle hinzufügen" : "Add cell"}
            </button>
          </div>
        </div>
        <div className="flex gap-3 pt-4">
          <Link href="/projects" className="btn-secondary flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            {t("newProject.backToList")}
          </Link>
          <button type="submit" disabled={loading || !canEdit} className="btn-primary">
            {loading ? t("newProject.creating") : t("newProject.create")}
          </button>
        </div>
      </form>
    </div>
  );
}

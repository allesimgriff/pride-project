"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil } from "lucide-react";
import {
  PROJECT_LABEL_DEFAULTS,
  type ProjectLabelKey,
  type ProjectLabelMap,
} from "@/lib/projectLabelDefaults";
import { ProjectLabelNrBadge } from "@/components/projects/ProjectLabelNrBadge";
import { useApp } from "@/components/providers/AppProvider";
import { getT } from "@/lib/i18n";
type EditScope = "workspace" | "global";

export function EditableProjectLabel({
  labelKey,
  fallback,
  workspaceId,
  projectLabels,
  canEdit,
  editScope = "workspace",
  showNr = false,
  nrTitle,
  onMapUpdate,
  className,
  textClassName,
  multiline = false,
}: {
  labelKey: ProjectLabelKey;
  fallback: string;
  workspaceId: string | null;
  projectLabels: ProjectLabelMap;
  canEdit: boolean;
  editScope?: EditScope;
  showNr?: boolean;
  nrTitle?: string;
  onMapUpdate?: (key: ProjectLabelKey, de: string, en: string) => void;
  className?: string;
  textClassName?: string;
  /** Längere Texte (z. B. Fußnoten): mehrzeilig im Editor. */
  multiline?: boolean;
}) {
  const router = useRouter();
  const { lang, edition } = useApp();
  const t = getT(lang);
  const item = projectLabels[labelKey];
  const display =
    lang === "de" ? (item?.de || fallback) : (item?.en || fallback);

  const [open, setOpen] = useState(false);
  const [de, setDe] = useState(item?.de ?? PROJECT_LABEL_DEFAULTS.find((d) => d.key === labelKey)?.label_de ?? "");
  const [en, setEn] = useState(item?.en ?? PROJECT_LABEL_DEFAULTS.find((d) => d.key === labelKey)?.label_en ?? "");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) return;
    const def = PROJECT_LABEL_DEFAULTS.find((d) => d.key === labelKey);
    setDe(item?.de ?? def?.label_de ?? "");
    setEn(item?.en ?? def?.label_en ?? "");
  }, [item?.de, item?.en, labelKey, open]);

  function togglePanel() {
    if (!open) {
      const def = PROJECT_LABEL_DEFAULTS.find((d) => d.key === labelKey);
      setDe(item?.de ?? def?.label_de ?? "");
      setEn(item?.en ?? def?.label_en ?? "");
    }
    setOpen((v) => !v);
  }

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const mayEdit =
    canEdit &&
    edition === "pride" &&
    (editScope === "global" || (editScope === "workspace" && Boolean(workspaceId)));

  async function postLabel(payload: Record<string, unknown>): Promise<string | null> {
    const res = await fetch("/api/project-labels", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    if (!res.ok) return data.error ?? "Fehler.";
    return null;
  }

  async function handleSave() {
    setSaving(true);
    let err: string | null = null;
    if (editScope === "global") {
      err = await postLabel({
        kind: "global",
        action: "save",
        key: labelKey,
        label_de: de,
        label_en: en,
      });
    } else if (workspaceId) {
      err = await postLabel({
        kind: "workspace",
        workspaceId,
        action: "save",
        key: labelKey,
        label_de: de,
        label_en: en,
      });
    }
    setSaving(false);
    if (err) {
      alert(err);
      return;
    }
    onMapUpdate?.(labelKey, de.trim(), en.trim());
    setOpen(false);
    router.refresh();
  }

  async function handleReset() {
    const def = PROJECT_LABEL_DEFAULTS.find((d) => d.key === labelKey);
    if (!def) return;
    if (editScope === "workspace" && workspaceId) {
      if (!confirm(t("labelsInline.resetConfirmWorkspace"))) return;
      setSaving(true);
      const err = await postLabel({
        kind: "workspace",
        workspaceId,
        action: "deleteOverride",
        key: labelKey,
      });
      setSaving(false);
      if (err) {
        alert(err);
        return;
      }
      setDe(def.label_de);
      setEn(def.label_en);
      onMapUpdate?.(labelKey, def.label_de, def.label_en);
      setOpen(false);
      router.refresh();
      return;
    }
    if (editScope === "global") {
      if (!confirm(t("labelsInline.resetConfirmGlobal"))) return;
      setSaving(true);
      const err = await postLabel({
        kind: "global",
        action: "resetToDefault",
        key: labelKey,
      });
      setSaving(false);
      if (err) {
        alert(err);
        return;
      }
      setDe(def.label_de);
      setEn(def.label_en);
      onMapUpdate?.(labelKey, def.label_de, def.label_en);
      setOpen(false);
      router.refresh();
    }
  }

  return (
    <span className={className ?? "inline-flex flex-col items-start gap-1"}>
      <span
        className={`inline-flex flex-wrap items-start gap-2 ${multiline ? "items-start" : "items-center"}`}
      >
        {showNr && <ProjectLabelNrBadge labelKey={labelKey} title={nrTitle} />}
        <span
          className={[
            textClassName,
            multiline && "max-w-full whitespace-pre-wrap text-left",
            mayEdit &&
              "cursor-pointer rounded px-0.5 hover:bg-gray-50 hover:underline hover:decoration-gray-400 hover:underline-offset-2",
          ]
            .filter(Boolean)
            .join(" ")}
          role={mayEdit ? "button" : undefined}
          tabIndex={mayEdit ? 0 : undefined}
          title={mayEdit ? t("labelsInline.edit") : undefined}
          onClick={(e) => {
            if (!mayEdit) return;
            e.preventDefault();
            togglePanel();
          }}
          onKeyDown={(e) => {
            if (!mayEdit) return;
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              togglePanel();
            }
          }}
        >
          {display}
        </span>
        {mayEdit && (
          <button
            type="button"
            className="rounded p-0.5 text-gray-500 hover:bg-gray-100 hover:text-gray-800"
            title={t("labelsInline.edit")}
            aria-label={t("labelsInline.edit")}
            onClick={(e) => {
              e.stopPropagation();
              togglePanel();
            }}
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
        )}
      </span>
      {open && mayEdit && (
        <div
          className="z-10 mt-1 w-full min-w-[min(100%,20rem)] max-w-xl rounded-md border border-gray-200 bg-white p-3 shadow-md sm:max-w-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="space-y-2">
            <div>
              <label className="block text-xs font-medium text-gray-600">{t("labelsInline.de")}</label>
              {multiline ? (
                <textarea
                  value={de}
                  onChange={(e) => setDe(e.target.value)}
                  rows={4}
                  className="input-base mt-0.5 w-full text-sm"
                  disabled={saving}
                />
              ) : (
                <input
                  value={de}
                  onChange={(e) => setDe(e.target.value)}
                  className="input-base mt-0.5 w-full text-sm"
                  disabled={saving}
                />
              )}
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600">{t("labelsInline.en")}</label>
              {multiline ? (
                <textarea
                  value={en}
                  onChange={(e) => setEn(e.target.value)}
                  rows={4}
                  className="input-base mt-0.5 w-full text-sm"
                  disabled={saving}
                />
              ) : (
                <input
                  value={en}
                  onChange={(e) => setEn(e.target.value)}
                  className="input-base mt-0.5 w-full text-sm"
                  disabled={saving}
                />
              )}
            </div>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" className="btn-primary text-xs" disabled={saving} onClick={handleSave}>
              {saving ? "…" : t("labelsInline.save")}
            </button>
            <button type="button" className="btn-secondary text-xs" disabled={saving} onClick={() => setOpen(false)}>
              {t("common.cancel")}
            </button>
            <button type="button" className="btn-secondary text-xs" disabled={saving} onClick={handleReset}>
              {t("labelsInline.reset")}
            </button>
          </div>
        </div>
      )}
    </span>
  );
}

"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import NextImage from "next/image";
import { formatDistanceToNow } from "date-fns";
import { de, enUS } from "date-fns/locale";
import { Paperclip, Upload, FileText, Image as ImageIcon, File, Trash2, Star } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { setProjectImageAction } from "@/app/actions/projects";
import { useApp } from "@/components/providers/AppProvider";
import { getT } from "@/lib/i18n";
import type { ProjectLabelMap } from "@/lib/projectLabelDefaults";
import { EditableProjectLabel } from "@/components/projects/EditableProjectLabel";

interface FileRecord {
  id: string;
  file_name: string;
  file_path: string;
  file_size: number | null;
  mime_type: string | null;
  created_at: string;
  profiles?: { full_name: string | null } | null;
}

interface ProjectFilesProps {
  projectId: string;
  files: FileRecord[];
  projectImageId: string | null;
  projectLabels: ProjectLabelMap;
  workspaceId: string | null;
  canEditLabels: boolean;
}

const ACCEPT = ".pdf,.png,.jpg,.jpeg,.gif,.webp,.doc,.docx,.xls,.xlsx,.ppt,.pptx";

export function ProjectFiles({
  projectId,
  files,
  projectImageId,
  projectLabels,
  workspaceId,
  canEditLabels,
}: ProjectFilesProps) {
  const router = useRouter();
  const { lang } = useApp();
  const t = getT(lang);
  const labelNrTitle =
    lang === "de"
      ? "Entspricht der Spalte „Nr.“ unter Überschriften für diesen Workspace"
      : "Matches the “Nr.” column under headings for this workspace";
  const dateLocale = lang === "de" ? de : enUS;
  const [uploading, setUploading] = useState(false);
  const [settingImage, setSettingImage] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [previewFile, setPreviewFile] = useState<FileRecord | null>(null);
  const isMac = typeof navigator !== "undefined" && /Mac|iPhone|iPad|MacIntel/.test(navigator.platform || "");

  async function handleSetProjectImage(fileId: string) {
    setSettingImage(fileId);
    const err = await setProjectImageAction(projectId, fileId);
    setSettingImage(null);
    if (err?.error) alert(err.error);
    else router.refresh();
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const fileList = e.target.files;
    if (!fileList?.length) return;
    const supabase = createClient();
    setUploading(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      alert("Bitte melden Sie sich erneut an, um Dateien hochzuladen.");
      setUploading(false);
      return;
    }
    let successCount = 0;
    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      const path = `${projectId}/${crypto.randomUUID()}_${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from("project-files")
        .upload(path, file, { upsert: false });
      if (uploadError) {
        alert(`Fehler beim Hochladen von ${file.name}: ${uploadError.message}`);
        continue;
      }
      const { error: insertError } = await supabase.from("project_files").insert({
        project_id: projectId,
        uploaded_by: user.id,
        file_name: file.name,
        file_path: path,
        file_size: file.size,
        mime_type: file.type,
      });
      if (insertError) {
        alert(`Fehler beim Speichern von ${file.name}: ${insertError.message}`);
        continue;
      }
      successCount++;
    }
    e.target.value = "";
    setUploading(false);
    if (successCount > 0) {
      alert(`${successCount} Datei(en) erfolgreich hochgeladen.`);
    }
    router.refresh();
  }

  async function handleDelete(fileId: string, filePath: string) {
    if (!confirm(t("files.deleteConfirm"))) return;
    const supabase = createClient();
    await supabase.storage.from("project-files").remove([filePath]);
    await supabase.from("project_files").delete().eq("id", fileId);
    router.refresh();
  }

  function getFileIcon(mime: string | null) {
    if (!mime) return <File className="h-4 w-4" />;
    if (mime.startsWith("image/")) return <ImageIcon className="h-4 w-4" />;
    if (mime === "application/pdf") return <FileText className="h-4 w-4" />;
    return <File className="h-4 w-4" />;
  }

  return (
    <div className="card p-6">
      <h2 className="flex flex-wrap items-center gap-2 text-lg font-semibold text-gray-900">
        <Paperclip className="h-5 w-5 shrink-0" />
        <EditableProjectLabel
          labelKey="files"
          fallback={t("files.title")}
          workspaceId={workspaceId}
          projectLabels={projectLabels}
          canEdit={canEditLabels}
          showNr
          nrTitle={labelNrTitle}
          textClassName="text-lg font-semibold text-gray-900"
        />
      </h2>
      <p className="mt-1 text-sm text-gray-500">
        {t("files.hint")}
      </p>

      <div className="mt-4">
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT}
          multiple
          onChange={handleUpload}
          className="hidden"
        />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="btn-secondary flex w-full items-center justify-center gap-2"
        >
          <Upload className="h-4 w-4" />
          {uploading ? t("files.uploading") : t("files.upload")}
        </button>
      </div>

      <ul className="mt-4 space-y-2">
        {files.map((file) => {
          const isImage = file.mime_type?.startsWith("image/") ?? false;
          const isProjectImage = projectImageId === file.id;
          return (
            <li
              key={file.id}
              className={`flex items-center gap-3 rounded-lg border px-3 py-2 ${isProjectImage ? "border-primary-300 bg-primary-50" : "border-gray-100 bg-surface-50"}`}
            >
              {/* Bildvorschau etwas größer */}
              <div className="h-20 w-28 shrink-0 overflow-hidden rounded border border-gray-200 bg-gray-50 flex items-center justify-center">
                {file.mime_type?.startsWith("image/") ? (
                  <NextImage
                    src={`/api/files/${file.id}/image`}
                    alt={file.file_name}
                    width={112}
                    height={80}
                    className="h-20 w-28 object-cover"
                    unoptimized
                    onClick={() => setPreviewFile(file)}
                    style={{ cursor: "pointer" }}
                  />
                ) : (
                  <span className="text-gray-500">
                    {getFileIcon(file.mime_type)}
                  </span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <a
                href={`/api/files/${file.id}/download`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="truncate text-sm font-medium text-primary-600 hover:underline"
                onClick={(e) => {
                  // wenn es ein Bild ist, lieber die Vorschau im Overlay öffnen
                  if (file.mime_type?.startsWith("image/")) {
                    e.preventDefault();
                    setPreviewFile(file);
                  }
                }}
                >
                  {file.file_name}
                </a>
                <p className="text-xs text-gray-500">
                  {isProjectImage && (
                    <span className="font-medium text-primary-600">{t("files.projectImage")} · </span>
                  )}
                  {formatDistanceToNow(new Date(file.created_at), {
                    addSuffix: true,
                    locale: dateLocale,
                  })}
                  {file.file_size != null && ` · ${(file.file_size / 1024).toFixed(1)} KB`}
                </p>
              </div>
              {isImage && (
                <button
                  type="button"
                  onClick={() => handleSetProjectImage(file.id)}
                  disabled={settingImage !== null}
                  title={isProjectImage ? t("files.isProjectImage") : t("files.setProjectImage")}
                  className={`inline-flex items-center gap-1 rounded px-2 py-1 text-xs font-medium ${isProjectImage ? "bg-primary-100 text-primary-700" : "text-gray-500 hover:bg-gray-100 hover:text-primary-600"}`}
                >
                  <Star className={`h-4 w-4 ${isProjectImage ? "fill-current" : ""}`} />
                  {settingImage === file.id ? "…" : isProjectImage ? t("files.projectImage") : t("files.setProjectImage")}
                </button>
              )}
              <button
                type="button"
                onClick={() => handleDelete(file.id, file.file_path)}
                className="text-gray-400 hover:text-red-600"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </li>
          );
        })}
      </ul>
      {files.length === 0 && (
        <p className="mt-4 text-center text-sm text-gray-500">
          {t("files.noFiles")}
        </p>
      )}

      {/* Vollbild-Vorschau für ein Bild */}
      {previewFile && previewFile.mime_type?.startsWith("image/") && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 px-4">
          <div className="max-h-[90vh] max-w-[90vw] rounded-lg bg-white p-4 shadow-xl">
            <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-gray-900">
                  {previewFile.file_name}
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  {lang === "de"
                    ? isMac
                      ? "Zum Drucken auf „Drucken“ klicken und dann ⌘+P verwenden."
                      : "Zum Drucken auf „Drucken“ klicken und dann Strg+P verwenden."
                    : isMac
                      ? "Click \"Print\" and then use ⌘+P to print."
                      : "Click \"Print\" and then use Ctrl+P to print."}
                </p>
              </div>
              <div className="mt-1 flex gap-2 sm:mt-0">
                <button
                  type="button"
                  onClick={async () => {
                    const printUrl = `/api/files/${previewFile.id}/image`;
                    const w = window.open("", "_blank");
                    if (!w) {
                      alert(lang === "de" ? "Popup blockiert. Bitte Popups für diese Seite erlauben." : "Popup blocked. Please allow popups for this site.");
                      return;
                    }
                    const hint =
                      lang === "de"
                        ? (isMac
                            ? "Zum Drucken bitte ⌘+P (oder im Browser-Menü „Drucken…“) verwenden."
                            : "Zum Drucken bitte Strg+P (oder im Browser-Menü „Drucken…“) verwenden.")
                        : (isMac
                            ? "To print, please use ⌘+P (or the browser \"Print…\" menu)."
                            : "To print, please use Ctrl+P (or the browser \"Print…\" menu).");
                    try {
                      const res = await fetch(printUrl, { credentials: "include" });
                      if (!res.ok) throw new Error(`HTTP ${res.status}`);
                      const blob = await res.blob();
                      const objectUrl = URL.createObjectURL(blob);

                      w.document.write(`<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>${previewFile.file_name}</title>
    <style>
      body { margin: 0; background: #fff; display: flex; flex-direction: column; align-items: center; justify-content: center; }
      img { max-width: 100vw; max-height: calc(100vh - 40px); }
      p { margin: 8px 16px 0; font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; font-size: 12px; color: #555; }
    </style>
  </head>
  <body>
    <p>${hint}</p>
    <img src="${objectUrl}" onload="window.print(); setTimeout(() => URL.revokeObjectURL('${objectUrl}'), 1000)" />
  </body>
</html>`);
                      w.document.close();
                    } catch {
                      w.close();
                      alert(lang === "de" ? "Bild konnte zum Drucken nicht geladen werden." : "Image could not be loaded for printing.");
                    }
                  }}
                  className="rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
                >
                  {lang === "de" ? "Drucken" : "Print"}
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewFile(null)}
                  className="rounded-md bg-primary-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-primary-700"
                >
                  {lang === "de" ? "Schließen" : "Close"}
                </button>
              </div>
            </div>
            <div className="flex max-h-[75vh] items-center justify-center overflow-auto">
              <NextImage
                src={`/api/files/${previewFile.id}/image`}
                alt={previewFile.file_name}
                width={1200}
                height={800}
                className="h-auto max-h-[75vh] w-auto max-w-full object-contain"
                unoptimized
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

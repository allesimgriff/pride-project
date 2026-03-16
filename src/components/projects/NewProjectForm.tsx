"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createProjectAction } from "@/app/actions/projects";
import { getNextDevNumberAction } from "@/app/actions/categories";
import type { ProjectStatus } from "@/types/database";
import { createClient } from "@/lib/supabase/client";
import { useApp } from "@/components/providers/AppProvider";
import { getT } from "@/lib/i18n";

interface NewProjectFormProps {
  categories: { name: string; prefix: string }[];
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

export function NewProjectForm({ categories }: NewProjectFormProps) {
  const router = useRouter();
  const { lang } = useApp();
  const t = getT(lang);
  const [loading, setLoading] = useState(false);
  const [loadingNumber, setLoadingNumber] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function onCategoryChange(prefix: string) {
    setForm((f) => ({ ...f, category: prefix }));
    if (!prefix) return;
    setLoadingNumber(true);
    const { devNumber } = await getNextDevNumberAction(prefix);
    setLoadingNumber(false);
    setForm((f) => ({ ...f, dev_number: devNumber }));
  }
  const [form, setForm] = useState({
    dev_number: "",
    product_name: "",
    category: "",
    status: "idee" as ProjectStatus,
    description: "",
    technical_notes: "",
    functions: "",
    materials: "",
    target_price: "",
    open_points: "",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const technical_data = {
      technical_notes: form.technical_notes || undefined,
    };
    const result = await createProjectAction({
      dev_number: form.dev_number,
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
    if (result?.error || !result?.id) {
      setLoading(false);
      alert(result.error);
      return;
    }

    // Wenn beim Anlegen schon Dateien ausgewählt wurden, jetzt hochladen
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

    setLoading(false);
    setUploadingFiles([]);
    if (fileInputRef.current) fileInputRef.current.value = "";

    router.push(`/projects/${result.id}`);
    router.refresh();
  }

  return (
    <div className="card p-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              {t("newProject.category")}
            </label>
            <select
              value={form.category}
              onChange={(e) => onCategoryChange(e.target.value)}
              className="input-base mt-1"
            >
              <option value="">{t("newProject.categorySelectPlaceholder")}</option>
              {categories.map((c) => (
                <option key={c.prefix} value={c.prefix}>
                  {c.name} ({c.prefix})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              {t("newProject.devNumber")} *
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
            />
            {loadingNumber && <p className="mt-1 text-xs text-gray-500">{t("newProject.numberSuggesting")}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              {t("newProject.productName")} *
            </label>
            <input
              value={form.product_name}
              onChange={(e) =>
                setForm((f) => ({ ...f, product_name: e.target.value }))
              }
              className="input-base mt-1"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              {t("newProject.status")}
            </label>
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
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              {t("newProject.targetPrice")}
            </label>
            <input
              type="number"
              step="0.01"
              value={form.target_price}
              onChange={(e) =>
                setForm((f) => ({ ...f, target_price: e.target.value }))
              }
              className="input-base mt-1"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            {t("newProject.description")}
          </label>
          <textarea
            value={form.description}
            onChange={(e) =>
              setForm((f) => ({ ...f, description: e.target.value }))
            }
            rows={3}
            className="input-base mt-1"
          />
        </div>
        {/* Dateien schon beim Anlegen auswählen */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            {t("files.title")}
          </label>
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
            {t("newProject.technicalNotes")}
          </label>
          <textarea
            value={form.technical_notes}
            onChange={(e) =>
              setForm((f) => ({ ...f, technical_notes: e.target.value }))
            }
            rows={2}
            className="input-base mt-1"
            placeholder={t("newProject.technicalNotesPlaceholder")}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            {t("newProject.functions")}
          </label>
          <textarea
            value={form.functions}
            onChange={(e) =>
              setForm((f) => ({ ...f, functions: e.target.value }))
            }
            rows={2}
            className="input-base mt-1"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            {t("newProject.materials")}
          </label>
          <textarea
            value={form.materials}
            onChange={(e) =>
              setForm((f) => ({ ...f, materials: e.target.value }))
            }
            rows={2}
            className="input-base mt-1"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            {t("newProject.openPoints")}
          </label>
          <textarea
            value={form.open_points}
            onChange={(e) =>
              setForm((f) => ({ ...f, open_points: e.target.value }))
            }
            rows={2}
            className="input-base mt-1"
          />
        </div>
        <div className="flex gap-3 pt-4">
          <Link href="/projects" className="btn-secondary flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            {t("newProject.backToList")}
          </Link>
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? t("newProject.creating") : t("newProject.create")}
          </button>
        </div>
      </form>
    </div>
  );
}

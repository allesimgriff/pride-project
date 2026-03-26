"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { de, enUS } from "date-fns/locale";
import { CheckSquare, Pencil, Plus, Square, Trash2 } from "lucide-react";
import { addTaskAction, toggleTaskAction, deleteTaskAction, updateTaskAction } from "@/app/actions/projects";
import type { TaskPriority } from "@/types/database";
import { useApp } from "@/components/providers/AppProvider";
import { getT } from "@/lib/i18n";
import type { ProjectLabelMap } from "@/lib/projectLabelDefaults";
import { EditableProjectLabel } from "@/components/projects/EditableProjectLabel";

interface Task {
  id: string;
  title: string;
  description: string | null;
  image_file_id?: string | null;
  image_photo_id?: string | null;
  priority: TaskPriority;
  due_date: string | null;
  completed: boolean;
  profiles_responsible?: { full_name: string | null } | null;
}

interface ProjectImageOption {
  id: string;
  file_name: string;
  mime_type: string | null;
}

interface LegacyPhotoOption {
  id: string;
  created_at: string;
}

function TaskImagePicker({
  images,
  legacyPhotos,
  selectedImageId,
  onSelect,
  lang,
}: {
  images: ProjectImageOption[];
  legacyPhotos: LegacyPhotoOption[];
  selectedImageId: string;
  onSelect: (imageId: string) => void;
  lang: "de" | "en";
}) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-gray-600">
        {lang === "de" ? "Bild zur Task (optional)" : "Task image (optional)"}
      </p>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => onSelect("")}
          className={`rounded border px-2 py-1 text-xs ${
            selectedImageId === ""
              ? "border-primary-500 bg-primary-50 text-primary-700"
              : "border-gray-300 bg-white text-gray-700"
          }`}
        >
          {lang === "de" ? "Kein Bild" : "No image"}
        </button>
      </div>
      {images.length > 0 ? (
        <div className="grid max-h-44 grid-cols-3 gap-2 overflow-y-auto rounded border border-gray-200 p-2 sm:grid-cols-4">
          {images.map((img) => {
            const value = `file:${img.id}`;
            const active = selectedImageId === value;
            return (
              <button
                key={img.id}
                type="button"
                onClick={() => onSelect(value)}
                title={img.file_name}
                className={`overflow-hidden rounded border text-left ${
                  active ? "border-primary-500 ring-1 ring-primary-500" : "border-gray-200"
                }`}
              >
                <img
                  src={`/api/files/${img.id}/image`}
                  alt={img.file_name}
                  className="h-16 w-full object-cover"
                  loading="lazy"
                />
                <p className="truncate px-1 py-1 text-[10px] text-gray-600">{img.file_name}</p>
              </button>
            );
          })}
        </div>
      ) : (
        <p className="text-xs text-gray-500">
          {lang === "de" ? "Keine Projektbilder vorhanden." : "No project images available."}
        </p>
      )}
      {legacyPhotos.length > 0 ? (
        <>
          <p className="text-xs font-medium text-gray-600">
            {lang === "de" ? "Weitere hochgeladene Fotos" : "Additional uploaded photos"}
          </p>
          <div className="grid max-h-44 grid-cols-3 gap-2 overflow-y-auto rounded border border-gray-200 p-2 sm:grid-cols-4">
            {legacyPhotos.map((photo) => {
              const value = `photo:${photo.id}`;
              const active = selectedImageId === value;
              return (
                <button
                  key={photo.id}
                  type="button"
                  onClick={() => onSelect(value)}
                  className={`overflow-hidden rounded border text-left ${
                    active ? "border-primary-500 ring-1 ring-primary-500" : "border-gray-200"
                  }`}
                >
                  <img
                    src={`/api/photos/${photo.id}/image`}
                    alt={lang === "de" ? "Foto" : "Photo"}
                    className="h-16 w-full object-cover"
                    loading="lazy"
                  />
                  <p className="truncate px-1 py-1 text-[10px] text-gray-600">
                    {lang === "de" ? "Alt-Foto" : "Legacy photo"}
                  </p>
                </button>
              );
            })}
          </div>
        </>
      ) : null}
    </div>
  );
}

interface ProjectTasksProps {
  projectId: string;
  tasks: Task[];
  projectImages: ProjectImageOption[];
  legacyPhotos: LegacyPhotoOption[];
  currentUserId?: string | null;
  projectLabels: ProjectLabelMap;
  workspaceId: string | null;
  canEditLabels: boolean;
}

const priorityColors: Record<TaskPriority, string> = {
  niedrig: "text-gray-500",
  mittel: "text-amber-600",
  hoch: "text-orange-600",
  dringend: "text-red-600",
};

export function ProjectTasks({
  projectId,
  tasks,
  projectImages,
  legacyPhotos,
  projectLabels,
  workspaceId,
  canEditLabels,
}: ProjectTasksProps) {
  const router = useRouter();
  const { lang } = useApp();
  const t = getT(lang);
  const labelNrTitle =
    lang === "de"
      ? "Entspricht der Spalte „Nr.“ unter Überschriften für diesen Workspace"
      : "Matches the “Nr.” column under headings for this workspace";
  const dateLocale = lang === "de" ? de : enUS;
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [savingTaskId, setSavingTaskId] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: "",
    description: "",
    image_file_id: "",
    priority: "mittel" as TaskPriority,
    due_date: "",
  });
  const [editForm, setEditForm] = useState({
    title: "",
    description: "",
    image_file_id: "",
    priority: "mittel" as TaskPriority,
    due_date: "",
  });

  async function handleAddTask(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) return;
    setLoading(true);
    const result = await addTaskAction(projectId, {
      title: form.title,
      description: form.description || null,
      image_file_id:
        form.image_file_id.startsWith("file:") ? form.image_file_id.replace("file:", "") : null,
      image_photo_id:
        form.image_file_id.startsWith("photo:") ? form.image_file_id.replace("photo:", "") : null,
      priority: form.priority,
      due_date: form.due_date || null,
    });
    setLoading(false);
    if (result?.error) {
      alert(result.error);
      return;
    }
    setForm({ title: "", description: "", image_file_id: "", priority: "mittel", due_date: "" });
    setShowForm(false);
    router.refresh();
  }

  async function handleToggle(taskId: string, completed: boolean) {
    await toggleTaskAction(taskId, completed);
    router.refresh();
  }

  async function handleDelete(taskId: string) {
    if (!confirm(t("tasks.deleteConfirm"))) return;
    await deleteTaskAction(taskId);
    router.refresh();
  }

  function startEdit(task: Task) {
    setEditingTaskId(task.id);
    setEditForm({
      title: task.title,
      description: task.description ?? "",
      image_file_id: task.image_file_id
        ? `file:${task.image_file_id}`
        : task.image_photo_id
          ? `photo:${task.image_photo_id}`
          : "",
      priority: task.priority,
      due_date: task.due_date ? task.due_date.slice(0, 10) : "",
    });
  }

  async function handleSaveEdit(taskId: string) {
    if (!editForm.title.trim()) return;
    setSavingTaskId(taskId);
    const res = await updateTaskAction(taskId, {
      title: editForm.title,
      description: editForm.description || null,
      image_file_id:
        editForm.image_file_id.startsWith("file:") ? editForm.image_file_id.replace("file:", "") : null,
      image_photo_id:
        editForm.image_file_id.startsWith("photo:")
          ? editForm.image_file_id.replace("photo:", "")
          : null,
      priority: editForm.priority,
      due_date: editForm.due_date || null,
    });
    setSavingTaskId(null);
    if (res?.error) {
      alert(res.error);
      return;
    }
    setEditingTaskId(null);
    router.refresh();
  }

  const openTasks = tasks.filter((t) => !t.completed);
  const doneTasks = tasks.filter((t) => t.completed);

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between">
        <h2 className="flex flex-wrap items-center gap-2 text-lg font-semibold text-gray-900">
          <CheckSquare className="h-5 w-5 shrink-0" />
          <EditableProjectLabel
            labelKey="tasksHeading"
            fallback={t("tasks.title")}
            workspaceId={workspaceId}
            projectLabels={projectLabels}
            canEdit={canEditLabels}
            showNr
            nrTitle={labelNrTitle}
            textClassName="text-lg font-semibold text-gray-900"
          />
        </h2>
        <button
          type="button"
          onClick={() => setShowForm(!showForm)}
          className="inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium text-primary-600 hover:bg-primary-50"
        >
          <Plus className="h-4 w-4" />
          {showForm ? t("common.cancel") : t("tasks.addTask")}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleAddTask} className="mt-4 space-y-3 rounded-lg border border-gray-200 bg-gray-50 p-4">
          <input
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            placeholder={t("tasks.titlePlaceholder")}
            className="input-base"
            required
          />
          <textarea
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            placeholder={t("tasks.descriptionPlaceholder")}
            rows={2}
            className="input-base"
          />
          <TaskImagePicker
            images={projectImages}
            legacyPhotos={legacyPhotos}
            selectedImageId={form.image_file_id}
            onSelect={(imageId) => setForm((f) => ({ ...f, image_file_id: imageId }))}
            lang={lang}
          />
          <div className="flex flex-wrap gap-3">
            <select
              value={form.priority}
              onChange={(e) =>
                setForm((f) => ({ ...f, priority: e.target.value as TaskPriority }))
              }
              className="input-base w-auto"
            >
              {(["niedrig", "mittel", "hoch", "dringend"] as const).map((p) => (
                <option key={p} value={p}>
                  {t(`tasks.priority.${p}`)}
                </option>
              ))}
            </select>
            <input
              type="date"
              value={form.due_date}
              onChange={(e) => setForm((f) => ({ ...f, due_date: e.target.value }))}
              className="input-base w-auto"
            />
            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? t("tasks.adding") : t("tasks.add")}
            </button>
          </div>
        </form>
      )}

      <ul className="mt-4 space-y-2">
        {openTasks.map((task) => (
          <li
            key={task.id}
            className="flex items-start gap-3 rounded-lg border border-gray-200 bg-white p-3"
          >
            <button
              type="button"
              onClick={() => handleToggle(task.id, true)}
              className="mt-0.5 text-gray-400 hover:text-primary-600"
            >
              <Square className="h-5 w-5" />
            </button>
            <div className="min-w-0 flex-1">
              {editingTaskId === task.id ? (
                <div className="space-y-2">
                  <input
                    value={editForm.title}
                    onChange={(e) => setEditForm((f) => ({ ...f, title: e.target.value }))}
                    className="input-base"
                  />
                  <textarea
                    value={editForm.description}
                    onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))}
                    rows={2}
                    className="input-base"
                  />
                  <TaskImagePicker
                    images={projectImages}
                    legacyPhotos={legacyPhotos}
                    selectedImageId={editForm.image_file_id}
                    onSelect={(imageId) => setEditForm((f) => ({ ...f, image_file_id: imageId }))}
                    lang={lang}
                  />
                  <div className="flex flex-wrap items-center gap-2">
                    <select
                      value={editForm.priority}
                      onChange={(e) =>
                        setEditForm((f) => ({ ...f, priority: e.target.value as TaskPriority }))
                      }
                      className="input-base w-auto"
                    >
                      {(["niedrig", "mittel", "hoch", "dringend"] as const).map((p) => (
                        <option key={p} value={p}>
                          {t(`tasks.priority.${p}`)}
                        </option>
                      ))}
                    </select>
                    <input
                      type="date"
                      value={editForm.due_date}
                      onChange={(e) => setEditForm((f) => ({ ...f, due_date: e.target.value }))}
                      className="input-base w-auto"
                    />
                    <button
                      type="button"
                      onClick={() => handleSaveEdit(task.id)}
                      disabled={savingTaskId === task.id}
                      className="btn-primary"
                    >
                      {savingTaskId === task.id ? t("common.saving") : t("common.save")}
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingTaskId(null)}
                      className="btn-secondary"
                    >
                      {t("common.cancel")}
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <p className="font-medium text-gray-900">{task.title}</p>
                  {task.image_file_id || task.image_photo_id ? (
                    <a
                      href={
                        task.image_file_id
                          ? `/api/files/${task.image_file_id}/image`
                          : `/api/photos/${task.image_photo_id}/image`
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 block"
                    >
                      <img
                        src={
                          task.image_file_id
                            ? `/api/files/${task.image_file_id}/image`
                            : `/api/photos/${task.image_photo_id}/image`
                        }
                        alt={lang === "de" ? "Task-Bild" : "Task image"}
                        className="h-24 w-24 rounded border border-gray-200 object-cover"
                        loading="lazy"
                      />
                    </a>
                  ) : null}
                  {task.description && (
                    <p className="mt-1 text-sm text-gray-500">{task.description}</p>
                  )}
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-gray-500">
                    <span className={priorityColors[task.priority]}>
                      {t(`tasks.priority.${task.priority}`)}
                    </span>
                    {task.due_date && (
                      <span>
                        {t("tasks.due")}: {format(new Date(task.due_date), "d. MMM yyyy", { locale: dateLocale })}
                      </span>
                    )}
                    {task.profiles_responsible?.full_name && (
                      <span>· {task.profiles_responsible.full_name}</span>
                    )}
                  </div>
                </>
              )}
            </div>
            <button
              type="button"
              onClick={() => startEdit(task)}
              className="text-gray-400 hover:text-primary-700"
            >
              <Pencil className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => handleDelete(task.id)}
              className="text-gray-400 hover:text-red-600"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </li>
        ))}
        {doneTasks.map((task) => (
          <li
            key={task.id}
            className="flex items-start gap-3 rounded-lg border border-gray-100 bg-gray-50 p-3 opacity-75"
          >
            <button
              type="button"
              onClick={() => {
                const confirmText =
                  lang === "de"
                    ? "Möchten Sie diese Aufgabe wirklich wieder als offen markieren?"
                    : "Do you really want to mark this task as open again?";
                if (!confirm(confirmText)) return;
                void handleToggle(task.id, false);
              }}
              className="mt-0.5 text-primary-600"
            >
              <CheckSquare className="h-5 w-5" />
            </button>
            <div className="min-w-0 flex-1">
              {editingTaskId === task.id ? (
                <div className="space-y-2">
                  <input
                    value={editForm.title}
                    onChange={(e) => setEditForm((f) => ({ ...f, title: e.target.value }))}
                    className="input-base"
                  />
                  <textarea
                    value={editForm.description}
                    onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))}
                    rows={2}
                    className="input-base"
                  />
                  <TaskImagePicker
                    images={projectImages}
                    legacyPhotos={legacyPhotos}
                    selectedImageId={editForm.image_file_id}
                    onSelect={(imageId) => setEditForm((f) => ({ ...f, image_file_id: imageId }))}
                    lang={lang}
                  />
                  <div className="flex flex-wrap items-center gap-2">
                    <select
                      value={editForm.priority}
                      onChange={(e) =>
                        setEditForm((f) => ({ ...f, priority: e.target.value as TaskPriority }))
                      }
                      className="input-base w-auto"
                    >
                      {(["niedrig", "mittel", "hoch", "dringend"] as const).map((p) => (
                        <option key={p} value={p}>
                          {t(`tasks.priority.${p}`)}
                        </option>
                      ))}
                    </select>
                    <input
                      type="date"
                      value={editForm.due_date}
                      onChange={(e) => setEditForm((f) => ({ ...f, due_date: e.target.value }))}
                      className="input-base w-auto"
                    />
                    <button
                      type="button"
                      onClick={() => handleSaveEdit(task.id)}
                      disabled={savingTaskId === task.id}
                      className="btn-primary"
                    >
                      {savingTaskId === task.id ? t("common.saving") : t("common.save")}
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingTaskId(null)}
                      className="btn-secondary"
                    >
                      {t("common.cancel")}
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <p className="font-medium text-gray-500 line-through">{task.title}</p>
                  {task.image_file_id || task.image_photo_id ? (
                    <a
                      href={
                        task.image_file_id
                          ? `/api/files/${task.image_file_id}/image`
                          : `/api/photos/${task.image_photo_id}/image`
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 block"
                    >
                      <img
                        src={
                          task.image_file_id
                            ? `/api/files/${task.image_file_id}/image`
                            : `/api/photos/${task.image_photo_id}/image`
                        }
                        alt={lang === "de" ? "Task-Bild" : "Task image"}
                        className="h-20 w-20 rounded border border-gray-200 object-cover"
                        loading="lazy"
                      />
                    </a>
                  ) : null}
                  <div className="mt-1 text-xs text-gray-400">
                    {task.profiles_responsible?.full_name}
                    {task.due_date && ` · ${format(new Date(task.due_date), "d. MMM yyyy", { locale: dateLocale })}`}
                  </div>
                </>
              )}
            </div>
            <button
              type="button"
              onClick={() => startEdit(task)}
              className="text-gray-400 hover:text-primary-700"
            >
              <Pencil className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => handleDelete(task.id)}
              className="text-gray-400 hover:text-red-600"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </li>
        ))}
      </ul>
      {tasks.length === 0 && !showForm && (
        <p className="mt-4 text-center text-sm text-gray-500">
          {t("tasks.noTasks")}
        </p>
      )}
    </div>
  );
}

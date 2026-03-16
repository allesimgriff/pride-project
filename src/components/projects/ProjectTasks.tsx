"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { de, enUS } from "date-fns/locale";
import { CheckSquare, Plus, Square, Trash2 } from "lucide-react";
import { addTaskAction, toggleTaskAction, deleteTaskAction } from "@/app/actions/projects";
import type { TaskPriority } from "@/types/database";
import { useApp } from "@/components/providers/AppProvider";
import { getT } from "@/lib/i18n";

interface Task {
  id: string;
  title: string;
  description: string | null;
  priority: TaskPriority;
  due_date: string | null;
  completed: boolean;
  profiles_responsible?: { full_name: string | null } | null;
}

interface ProjectTasksProps {
  projectId: string;
  tasks: Task[];
  currentUserId?: string | null;
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
}: ProjectTasksProps) {
  const router = useRouter();
  const { lang } = useApp();
  const t = getT(lang);
  const dateLocale = lang === "de" ? de : enUS;
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
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
      priority: form.priority,
      due_date: form.due_date || null,
    });
    setLoading(false);
    if (result?.error) {
      alert(result.error);
      return;
    }
    setForm({ title: "", description: "", priority: "mittel", due_date: "" });
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

  const openTasks = tasks.filter((t) => !t.completed);
  const doneTasks = tasks.filter((t) => t.completed);

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-900">
          <CheckSquare className="h-5 w-5" />
          {t("tasks.title")}
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
              <p className="font-medium text-gray-900">{task.title}</p>
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
            </div>
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
              onClick={() => handleToggle(task.id, false)}
              className="mt-0.5 text-primary-600"
            >
              <CheckSquare className="h-5 w-5" />
            </button>
            <div className="min-w-0 flex-1">
              <p className="font-medium text-gray-500 line-through">{task.title}</p>
              <div className="mt-1 text-xs text-gray-400">
                {task.profiles_responsible?.full_name}
                {task.due_date && ` · ${format(new Date(task.due_date), "d. MMM yyyy", { locale: dateLocale })}`}
              </div>
            </div>
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

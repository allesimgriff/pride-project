"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckSquare, Plus, Square } from "lucide-react";
import { addTaskAction, addTasksBulkAction, toggleTaskAction, deleteTaskAction } from "@/app/actions/projects";
import { useApp } from "@/components/providers/AppProvider";

interface ChecklistTask {
  id: string;
  title: string;
  completed: boolean;
}

interface ProjectChecklistProps {
  projectId: string;
  tasks: ChecklistTask[];
}

export function ProjectChecklist({ projectId, tasks }: ProjectChecklistProps) {
  const router = useRouter();
  const { lang } = useApp();
  const [adding, setAdding] = useState(false);
  const [bulkAdding, setBulkAdding] = useState(false);
  const [saving, setSaving] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [bulkText, setBulkText] = useState("");

  function parseBulkChecklist(input: string) {
    return input
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
      .filter((line) => !/^manufacturer checklist$/i.test(line))
      .filter((line) => !/gkv medical aids directory/i.test(line))
      .filter((line) => !/^seating aids for care facilitation/i.test(line))
      // Abschnitts-Überschriften wie "1. Construction" entfernen
      .filter((line) => !/^\d+[\.\)]\s+[A-Za-zÄÖÜäöü]/.test(line))
      // Einfache Rubrikzeilen wie "Construction" entfernen
      .filter((line) => !/^(construction|mobility|safety|material|product labeling|technical data|documentation|supply services)$/i.test(line));
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!newTitle.trim()) return;
    setSaving(true);
    const result = await addTaskAction(projectId, {
      title: newTitle.trim(),
      description: null,
      priority: "mittel",
      due_date: null,
    });
    setSaving(false);
    if (result?.error) {
      alert(result.error);
      return;
    }
    setNewTitle("");
    setAdding(false);
    router.refresh();
  }

  async function handleBulkAdd(e: React.FormEvent) {
    e.preventDefault();
    const parsed = parseBulkChecklist(bulkText);
    if (parsed.length === 0) {
      alert(lang === "de" ? "Keine Aufgaben erkannt." : "No tasks recognized.");
      return;
    }
    setSaving(true);
    const result = await addTasksBulkAction(projectId, parsed);
    setSaving(false);
    if ((result as { error?: string })?.error) {
      alert((result as { error: string }).error);
      return;
    }
    setBulkText("");
    setBulkAdding(false);
    router.refresh();
  }

  async function handleToggle(taskId: string, completed: boolean) {
    if (!completed) {
      const confirmText =
        lang === "de"
          ? "Möchten Sie dieses Kästchen wirklich wieder als offen markieren?"
          : "Do you really want to uncheck this item?";
      if (!confirm(confirmText)) return;
    }
    await toggleTaskAction(taskId, completed);
    router.refresh();
  }

  async function handleDelete(taskId: string) {
    const confirmText =
      lang === "de"
        ? "Möchten Sie diese Zelle wirklich löschen?"
        : "Do you really want to delete this item?";
    if (!confirm(confirmText)) return;
    await deleteTaskAction(taskId);
    router.refresh();
  }

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-900">
          <CheckSquare className="h-5 w-5" />
          {lang === "de" ? "Checkliste" : "Checklist"}
        </h2>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setAdding((v) => !v)}
            className="inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium text-primary-600 hover:bg-primary-50"
          >
            <Plus className="h-4 w-4" />
            {adding
              ? lang === "de"
                ? "Abbrechen"
                : "Cancel"
              : lang === "de"
                ? "Zelle hinzufügen"
                : "Add cell"}
          </button>
          <button
            type="button"
            onClick={() => setBulkAdding((v) => !v)}
            className="inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium text-primary-600 hover:bg-primary-50"
          >
            {bulkAdding
              ? lang === "de"
                ? "Abbrechen"
                : "Cancel"
              : lang === "de"
                ? "Liste einfügen"
                : "Paste list"}
          </button>
        </div>
      </div>

      {adding && (
        <form onSubmit={handleAdd} className="mt-4 space-y-3 rounded-lg border border-gray-200 bg-gray-50 p-4">
          <input
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder={lang === "de" ? "Aufgabe oder Entwicklungsschritt" : "Task or step"}
            className="input-base"
            required
          />
          <button type="submit" disabled={saving} className="btn-primary">
            {saving
              ? lang === "de"
                ? "Speichere..."
                : "Saving..."
              : lang === "de"
                ? "Hinzufügen"
                : "Add"}
          </button>
        </form>
      )}

      {bulkAdding && (
        <form onSubmit={handleBulkAdd} className="mt-4 space-y-3 rounded-lg border border-gray-200 bg-gray-50 p-4">
          <p className="text-xs text-gray-500">
            {lang === "de"
              ? "Eine Aufgabe pro Zeile einfügen. Abschnittsüberschriften werden automatisch ignoriert."
              : "Paste one task per line. Section headings are ignored automatically."}
          </p>
          <textarea
            value={bulkText}
            onChange={(e) => setBulkText(e.target.value)}
            rows={10}
            className="input-base"
            placeholder={lang === "de" ? "Aufgabenliste hier einfügen..." : "Paste checklist here..."}
            required
          />
          <button type="submit" disabled={saving} className="btn-primary">
            {saving
              ? lang === "de"
                ? "Übernehme..."
                : "Applying..."
              : lang === "de"
                ? "Als Aufgaben übernehmen"
                : "Add as tasks"}
          </button>
        </form>
      )}

      <ul className="mt-4 space-y-2">
        {tasks.map((task) => (
          <li
            key={task.id}
            className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white px-3 py-2"
          >
            <button
              type="button"
              onClick={() => handleToggle(task.id, !task.completed)}
              className="text-gray-400 hover:text-primary-600"
            >
              {task.completed ? (
                <CheckSquare className="h-5 w-5 text-primary-600" />
              ) : (
                <Square className="h-5 w-5" />
              )}
            </button>
            <span
              className={
                task.completed
                  ? "flex-1 truncate text-sm text-gray-500 line-through"
                  : "flex-1 truncate text-sm text-gray-900"
              }
            >
              {task.title}
            </span>
            <button
              type="button"
              onClick={() => handleDelete(task.id)}
              className="text-xs text-gray-400 hover:text-red-600"
            >
              {lang === "de" ? "Entfernen" : "Remove"}
            </button>
          </li>
        ))}
      </ul>

      {tasks.length === 0 && !adding && !bulkAdding && (
        <p className="mt-4 text-center text-sm text-gray-500">
          {lang === "de"
            ? "Noch keine Einträge in der Checkliste."
            : "No checklist items yet."}
        </p>
      )}
    </div>
  );
}


"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Trash2, Plus } from "lucide-react";
import {
  createCategoryAction,
  updateCategoryAction,
  deleteCategoryAction,
} from "@/app/actions/categories";
import type { ProjectCategory } from "@/types/database";
import { useApp } from "@/components/providers/AppProvider";
import { getT } from "@/lib/i18n";

interface CategoriesManagerProps {
  categories: ProjectCategory[];
}

export function CategoriesManager({ categories: initial }: CategoriesManagerProps) {
  const router = useRouter();
  const { lang } = useApp();
  const t = getT(lang);
  const [categories, setCategories] = useState(initial);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editPrefix, setEditPrefix] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [newName, setNewName] = useState("");
  const [newPrefix, setNewPrefix] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSave(id: string) {
    setLoading(true);
    const result = await updateCategoryAction(id, editName, editPrefix);
    setLoading(false);
    if (result?.error) {
      alert(result.error);
      return;
    }
    setCategories((prev) =>
      prev.map((c) => (c.id === id ? { ...c, name: editName, prefix: editPrefix } : c))
    );
    setEditingId(null);
    router.refresh();
  }

  async function handleAdd() {
    if (!newName.trim() || !newPrefix.trim()) {
      alert(t("categories.fillNamePrefix"));
      return;
    }
    setLoading(true);
    const result = await createCategoryAction(newName.trim(), newPrefix.trim());
    setLoading(false);
    if (result?.error) {
      alert(result.error);
      return;
    }
    setNewName("");
    setNewPrefix("");
    setShowNew(false);
    router.refresh();
  }

  async function handleDelete(id: string) {
    if (!confirm(t("categories.deleteConfirm"))) return;
    setLoading(true);
    const result = await deleteCategoryAction(id);
    setLoading(false);
    if (result?.error) {
      alert(result.error);
      return;
    }
    setCategories((prev) => prev.filter((c) => c.id !== id));
    setEditingId(null);
    router.refresh();
  }

  function startEdit(c: ProjectCategory) {
    setEditingId(c.id);
    setEditName(c.name);
    setEditPrefix(c.prefix);
  }

  return (
    <div className="card p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">{t("categories.titleManager")}</h2>
        <button
          type="button"
          onClick={() => setShowNew(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          {t("categories.add")}
        </button>
      </div>

      {showNew && (
        <div className="mb-4 flex flex-wrap items-end gap-3 rounded-lg border border-gray-200 bg-gray-50 p-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">{t("categories.name")}</label>
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="input-base mt-1 w-48"
              placeholder="z. B. Bank"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">{t("categories.prefix")}</label>
            <input
              value={newPrefix}
              onChange={(e) => setNewPrefix(e.target.value)}
              className="input-base mt-1 w-40 font-mono"
              placeholder="z. B. PM_Bank"
            />
          </div>
          <button type="button" onClick={handleAdd} disabled={loading} className="btn-primary">
            {t("categories.save")}
          </button>
          <button type="button" onClick={() => setShowNew(false)} className="btn-secondary">
            {t("categories.cancel")}
          </button>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">{t("categories.name")}</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">{t("categories.prefixShort")}</th>
              <th className="px-4 py-3 text-right text-xs font-medium uppercase text-gray-500">{t("categories.actions")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {categories.map((c) => (
              <tr key={c.id}>
                {editingId === c.id ? (
                  <>
                    <td className="px-4 py-2">
                      <input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="input-base w-48"
                      />
                    </td>
                    <td className="px-4 py-2">
                      <input
                        value={editPrefix}
                        onChange={(e) => setEditPrefix(e.target.value)}
                        className="input-base w-40 font-mono"
                      />
                    </td>
                    <td className="px-4 py-2 text-right">
                      <button
                        type="button"
                        onClick={() => handleSave(c.id)}
                        disabled={loading}
                        className="text-primary-600 hover:text-primary-700 mr-2"
                      >
                        {t("categories.save")}
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingId(null)}
                        className="text-gray-500 hover:text-gray-700"
                      >
                        {t("categories.cancel")}
                      </button>
                    </td>
                  </>
                ) : (
                  <>
                    <td className="px-4 py-3 text-sm text-gray-900">{c.name}</td>
                    <td className="px-4 py-3 font-mono text-sm text-gray-600">{c.prefix}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => startEdit(c)}
                        className="text-gray-500 hover:text-gray-700 mr-2"
                        title={t("categories.edit")}
                      >
                        <Pencil className="h-4 w-4 inline" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(c.id)}
                        className="text-red-500 hover:text-red-700"
                        title={t("categories.delete")}
                      >
                        <Trash2 className="h-4 w-4 inline" />
                      </button>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

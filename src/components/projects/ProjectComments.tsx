"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { de, enUS } from "date-fns/locale";
import { MessageSquare, Send } from "lucide-react";
import { addCommentAction } from "@/app/actions/projects";
import { useApp } from "@/components/providers/AppProvider";
import { getT } from "@/lib/i18n";
import type { ProjectLabelMap } from "@/lib/projectLabelDefaults";
import { EditableProjectLabel } from "@/components/projects/EditableProjectLabel";

interface Comment {
  id: string;
  content: string;
  created_at: string;
  profiles?: { full_name: string | null } | null;
}

interface ProjectCommentsProps {
  projectId: string;
  comments: Comment[];
  currentUserId?: string | null;
  projectLabels: ProjectLabelMap;
  workspaceId: string | null;
  canEditLabels: boolean;
}

export function ProjectComments({
  projectId,
  comments,
  projectLabels,
  workspaceId,
  canEditLabels,
}: ProjectCommentsProps) {
  const router = useRouter();
  const { lang } = useApp();
  const t = getT(lang);
  const labelNrTitle =
    lang === "de"
      ? "Entspricht der Spalte „Nr.“ unter Überschriften für diesen Workspace"
      : "Matches the “Nr.” column under headings for this workspace";
  const dateLocale = lang === "de" ? de : enUS;
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) return;
    setLoading(true);
    const result = await addCommentAction(projectId, content);
    setLoading(false);
    if (result?.error) {
      alert(result.error);
      return;
    }
    setContent("");
    router.refresh();
  }

  return (
    <div className="card p-6">
      <h2 className="flex flex-wrap items-center gap-2 text-lg font-semibold text-gray-900">
        <MessageSquare className="h-5 w-5 shrink-0" />
        <EditableProjectLabel
          labelKey="commentsHeading"
          fallback={t("comments.title")}
          workspaceId={workspaceId}
          projectLabels={projectLabels}
          canEdit={canEditLabels}
          showNr
          nrTitle={labelNrTitle}
          textClassName="text-lg font-semibold text-gray-900"
        />
      </h2>

      <form onSubmit={handleSubmit} className="mt-4">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={t("comments.placeholder")}
          rows={3}
          className="input-base"
          disabled={loading}
        />
        <div className="mt-2 flex justify-end">
          <button type="submit" disabled={loading || !content.trim()} className="btn-primary flex items-center gap-2">
            <Send className="h-4 w-4" />
            {loading ? t("comments.sending") : t("comments.send")}
          </button>
        </div>
      </form>

      <ul className="mt-6 space-y-4">
        {comments.map((comment) => (
          <li
            key={comment.id}
            className="rounded-lg border border-gray-100 bg-surface-50 p-4"
          >
            <p className="text-sm text-gray-900 whitespace-pre-wrap">
              {comment.content}
            </p>
            <p className="mt-2 text-xs text-gray-500">
              {comment.profiles?.full_name ?? t("comments.unknown")} ·{" "}
              {formatDistanceToNow(new Date(comment.created_at), {
                addSuffix: true,
                locale: dateLocale,
              })}
            </p>
          </li>
        ))}
      </ul>
      {comments.length === 0 && (
        <p className="mt-4 text-center text-sm text-gray-500">
          {t("comments.noComments")}
        </p>
      )}
    </div>
  );
}

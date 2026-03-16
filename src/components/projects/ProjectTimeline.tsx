"use client";

import { format } from "date-fns";
import { de, enUS } from "date-fns/locale";
import { MessageSquare, History, Paperclip } from "lucide-react";
import { useApp } from "@/components/providers/AppProvider";
import { getT } from "@/lib/i18n";

interface Comment {
  id: string;
  content: string;
  created_at: string;
  profiles?: { full_name: string | null } | null;
}

interface Update {
  id: string;
  change_summary: string;
  created_at: string;
  profiles?: { full_name: string | null } | null;
}

interface File {
  id: string;
  file_name: string;
  created_at: string;
  profiles?: { full_name: string | null } | null;
}

type TimelineItem =
  | { type: "comment"; id: string; date: string; author: string; content: string }
  | { type: "update"; id: string; date: string; author: string; content: string }
  | { type: "file"; id: string; date: string; author: string; content: string; fileId: string };

interface ProjectTimelineProps {
  comments: Comment[];
  updates: Update[];
  files: File[];
}

function buildTimeline(
  comments: Comment[],
  updates: Update[],
  files: File[],
  unknownLabel: string
): TimelineItem[] {
  const items: TimelineItem[] = [];
  comments.forEach((c) => {
    items.push({
      type: "comment",
      id: c.id,
      date: c.created_at,
      author: c.profiles?.full_name ?? unknownLabel,
      content: c.content,
    });
  });
  updates.forEach((u) => {
    items.push({
      type: "update",
      id: u.id,
      date: u.created_at,
      author: u.profiles?.full_name ?? unknownLabel,
      content: u.change_summary,
    });
  });
  files.forEach((f) => {
    items.push({
      type: "file",
      id: f.id,
      fileId: f.id,
      date: f.created_at,
      author: f.profiles?.full_name ?? unknownLabel,
      content: f.file_name,
    });
  });
  items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  return items;
}

export function ProjectTimeline({ comments, updates, files }: ProjectTimelineProps) {
  const { lang } = useApp();
  const t = getT(lang);
  const dateLocale = lang === "de" ? de : enUS;
  const items = buildTimeline(comments, updates, files, t("comments.unknown"));

  return (
    <div className="card p-6">
      <h2 className="text-lg font-semibold text-gray-900">{t("timeline.title")}</h2>
      <p className="mt-1 text-sm text-gray-500">
        {t("timeline.subtitle")}
      </p>
      <ul className="mt-4 space-y-0">
        {items.map((item) => (
          <li
            key={`${item.type}-${item.id}`}
            className="flex gap-3 border-b border-gray-100 py-3 last:border-b-0"
          >
            <span className="mt-0.5 text-gray-400">
              {item.type === "comment" && <MessageSquare className="h-4 w-4" />}
              {item.type === "update" && <History className="h-4 w-4" />}
              {item.type === "file" && <Paperclip className="h-4 w-4" />}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm text-gray-900">
                {item.type === "comment" && item.content}
                {item.type === "update" && item.content}
                {item.type === "file" && (
                  <a
                    href={`/api/files/${item.fileId}/download`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary-600 hover:underline"
                  >
                    {item.content}
                  </a>
                )}
              </p>
              <p className="mt-1 text-xs text-gray-500">
                {item.author} ·{" "}
                {format(new Date(item.date), "d. MMM yyyy, HH:mm", { locale: dateLocale })}
                {item.type === "comment" && ` · ${t("timeline.comment")}`}
                {item.type === "update" && ` · ${t("timeline.update")}`}
                {item.type === "file" && ` · ${t("timeline.file")}`}
              </p>
            </div>
          </li>
        ))}
      </ul>
      {items.length === 0 && (
        <p className="py-6 text-center text-sm text-gray-500">
          {t("timeline.noEntries")}
        </p>
      )}
    </div>
  );
}

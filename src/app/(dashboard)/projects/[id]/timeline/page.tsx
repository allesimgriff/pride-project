import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { buildMergedProjectLabelMap } from "@/lib/projectLabelDefaults";
import { canEditWorkspaceLabels } from "@/lib/workspacePermissions";
import { getAuthUser } from "@/lib/auth/cachedDashboardSession";
import { ProjectTimeline } from "@/components/projects/ProjectTimeline";

export default async function ProjectTimelinePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const projectRes = await supabase
    .from("projects")
    .select("id, product_name, workspace_id")
    .eq("id", id)
    .single();

  if (projectRes.error || !projectRes.data) notFound();
  const project = projectRes.data;

  const [user, labelsRes, wsLabelsRes, commentsRes, filesRes, updatesRes] = await Promise.all([
    getAuthUser(),
    supabase.from("project_labels").select("key,label_de,label_en"),
    supabase
      .from("workspace_project_labels")
      .select("key,label_de,label_en")
      .eq("workspace_id", project.workspace_id),
    supabase
      .from("project_comments")
      .select("*, profiles:author_id (id, full_name)")
      .eq("project_id", id)
      .order("created_at", { ascending: false }),
    supabase
      .from("project_files")
      .select("id, file_name, created_at, profiles:uploaded_by (id, full_name)")
      .eq("project_id", id)
      .order("created_at", { ascending: false }),
    supabase
      .from("project_updates")
      .select("id, change_summary, created_at, profiles:author_id (id, full_name)")
      .eq("project_id", id)
      .order("created_at", { ascending: false }),
  ]);

  const projectLabels = buildMergedProjectLabelMap(labelsRes.data || [], wsLabelsRes.data || []);
  const normalizedComments = (commentsRes.data || []).map((c) => ({
    ...c,
    profiles: Array.isArray(c.profiles) ? (c.profiles[0] ?? null) : (c.profiles ?? null),
  }));
  const normalizedUpdates = (updatesRes.data || []).map((u) => ({
    ...u,
    profiles: Array.isArray(u.profiles) ? (u.profiles[0] ?? null) : (u.profiles ?? null),
  }));
  const normalizedFiles = (filesRes.data || []).map((f) => ({
    ...f,
    profiles: Array.isArray(f.profiles) ? (f.profiles[0] ?? null) : (f.profiles ?? null),
  }));
  let canEditLabels = false;
  if (user && project.workspace_id) {
    canEditLabels = await canEditWorkspaceLabels(supabase, user.id, project.workspace_id);
  }

  return (
    <div className="space-y-4">
      <div className="no-print">
        <Link href={`/projects/${id}`} className="text-sm font-medium text-primary-700 hover:underline">
          Zurück zum Projekt
        </Link>
      </div>
      <ProjectTimeline
        projectId={id}
        comments={normalizedComments}
        updates={normalizedUpdates}
        files={normalizedFiles}
        projectLabels={projectLabels}
        workspaceId={project.workspace_id}
        canEditLabels={canEditLabels}
      />
    </div>
  );
}

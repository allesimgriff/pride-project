import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { buildMergedProjectLabelMap } from "@/lib/projectLabelDefaults";
import { canEditWorkspaceLabels } from "@/lib/workspacePermissions";
import { getAuthUser } from "@/lib/auth/cachedDashboardSession";
import { ProjectHistory } from "@/components/projects/ProjectHistory";

export default async function ProjectHistoryPage({
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

  const [user, labelsRes, wsLabelsRes, updatesRes] = await Promise.all([
    getAuthUser(),
    supabase.from("project_labels").select("key,label_de,label_en"),
    supabase
      .from("workspace_project_labels")
      .select("key,label_de,label_en")
      .eq("workspace_id", project.workspace_id),
    supabase
      .from("project_updates")
      .select("id, change_summary, changes, created_at, profiles:author_id (id, full_name)")
      .eq("project_id", id)
      .order("created_at", { ascending: false }),
  ]);

  const projectLabels = buildMergedProjectLabelMap(labelsRes.data || [], wsLabelsRes.data || []);
  const normalizedUpdates = (updatesRes.data || []).map((u) => ({
    ...u,
    profiles: Array.isArray(u.profiles) ? (u.profiles[0] ?? null) : (u.profiles ?? null),
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
      <ProjectHistory
        projectId={id}
        updates={normalizedUpdates}
        projectLabels={projectLabels}
        workspaceId={project.workspace_id}
        canEditLabels={canEditLabels}
        limit={500}
      />
    </div>
  );
}

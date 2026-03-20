import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { DetailBackLink } from "@/components/projects/DetailBackLink";
import { ProjectDetailHeader } from "@/components/projects/ProjectDetailHeader";
import { ProjectStammdaten } from "@/components/projects/ProjectStammdaten";
import { ProjectFiles } from "@/components/projects/ProjectFiles";
import { ProjectComments } from "@/components/projects/ProjectComments";
import { ProjectTasks } from "@/components/projects/ProjectTasks";
import { ProjectChecklist } from "@/components/projects/ProjectChecklist";
import { ProjectTimeline } from "@/components/projects/ProjectTimeline";
import { ProjectHistory } from "@/components/projects/ProjectHistory";
import { ProjectPhotosSection } from "@/components/projects/ProjectPhotosSection";
import { buildProjectLabelMap } from "@/lib/projectLabelDefaults";
import { canManageProjectAsAdmin } from "@/lib/workspacePermissions";
import { listWorkspacesForProjectMoveAction } from "@/app/actions/workspaces";
import { ProjectWorkspaceMove } from "@/components/projects/ProjectWorkspaceMove";

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: project, error } = await supabase
    .from("projects")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !project) {
    notFound();
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const canEdit = Boolean(
    user && (await canManageProjectAsAdmin(supabase, user.id, project.workspace_id ?? null))
  );

  let moveTargets: { id: string; name: string }[] = [];
  let currentWorkspaceName = "";
  if (canEdit && project.workspace_id) {
    const [moveList, wsRes] = await Promise.all([
      listWorkspacesForProjectMoveAction(),
      supabase.from("workspaces").select("name").eq("id", project.workspace_id).single(),
    ]);
    moveTargets = moveList.error ? [] : moveList.data;
    currentWorkspaceName = wsRes.data?.name ?? "—";
  }

  const { data: labelsRaw } = await supabase
    .from("project_labels")
    .select("key,label_de,label_en");
  const projectLabels = buildProjectLabelMap(labelsRaw || []);

  const [
    { data: comments },
    { data: files },
    { data: tasks },
    { data: updates },
    { data: categories },
  ] = await Promise.all([
    supabase
      .from("project_comments")
      .select("*, profiles:author_id (id, full_name)")
      .eq("project_id", id)
      .order("created_at", { ascending: false }),
    supabase
      .from("project_files")
      .select("*, profiles:uploaded_by (id, full_name)")
      .eq("project_id", id)
      .order("created_at", { ascending: false }),
    supabase
      .from("project_tasks")
      .select("*, profiles_responsible:responsible_id (id, full_name)")
      .eq("project_id", id)
      .order("completed", { ascending: true })
      .order("due_date", { ascending: true, nullsFirst: false }),
    supabase
      .from("project_updates")
      .select("*, profiles:author_id (id, full_name)")
      .eq("project_id", id)
      .order("created_at", { ascending: false }),
    supabase.from("project_categories").select("name, prefix").order("sort_order", { ascending: true }),
  ]);

  return (
    <div className="space-y-6 print-detail-page">
      <div className="no-print flex items-center gap-4">
        <DetailBackLink />
      </div>

      <ProjectDetailHeader project={project} />

      {canEdit ? (
        <ProjectWorkspaceMove
          projectId={id}
          currentWorkspaceId={project.workspace_id}
          currentWorkspaceName={currentWorkspaceName}
          targets={moveTargets}
        />
      ) : null}

      <div className="grid gap-6 lg:grid-cols-3 print-grid">
        <div className="lg:col-span-2 space-y-6 print-main-column">
          <div className="card p-6">
            <h2 className="mb-3 text-lg font-semibold text-gray-900">
              Fotos zum Projekt
            </h2>
            <p className="mb-3 text-sm text-gray-500">
              Hier kannst du direkt vom Handy (Kamera/Galerie) oder vom Rechner Fotos hochladen.
            </p>
            <ProjectPhotosSection />
          </div>

          <ProjectFiles projectId={id} files={files || []} projectImageId={project.project_image_id ?? null} />
          <ProjectStammdaten project={project} categories={categories || []} canEdit={canEdit} projectLabels={projectLabels} />
          <ProjectComments
            projectId={id}
            comments={comments || []}
            currentUserId={(await supabase.auth.getUser()).data.user?.id}
          />
          <ProjectChecklist
            projectId={id}
            tasks={(tasks || []).map((t) => ({
              id: t.id,
              title: t.title,
              completed: t.completed,
            }))}
          />
          <ProjectTasks
            projectId={id}
            tasks={tasks || []}
            currentUserId={(await supabase.auth.getUser()).data.user?.id}
          />
        </div>
        <div className="no-print space-y-6">
          <ProjectTimeline
            comments={comments || []}
            updates={updates || []}
            files={files || []}
          />
          <ProjectHistory updates={updates || []} />
        </div>
      </div>
    </div>
  );
}

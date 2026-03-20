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
import { getAuthUser } from "@/lib/auth/cachedDashboardSession";

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [projectRes, user, labelsRes, categoriesRes] = await Promise.all([
    supabase.from("projects").select("*").eq("id", id).single(),
    getAuthUser(),
    supabase.from("project_labels").select("key,label_de,label_en"),
    supabase
      .from("project_categories")
      .select("name, prefix")
      .order("sort_order", { ascending: true }),
  ]);

  if (projectRes.error || !projectRes.data) {
    notFound();
  }
  const project = projectRes.data;
  const projectLabels = buildProjectLabelMap(labelsRes.data || []);
  const categories = categoriesRes.data;

  const canEdit = Boolean(
    user && (await canManageProjectAsAdmin(supabase, user.id, project.workspace_id ?? null)),
  );

  const detailBundle = Promise.all([
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
  ]);

  let moveTargets: { id: string; name: string }[] = [];
  let currentWorkspaceName = "";

  let commentsRes: Awaited<typeof detailBundle>[0];
  let filesRes: Awaited<typeof detailBundle>[1];
  let tasksRes: Awaited<typeof detailBundle>[2];
  let updatesRes: Awaited<typeof detailBundle>[3];

  if (canEdit && project.workspace_id) {
    const [detail, moveList, wsRes] = await Promise.all([
      detailBundle,
      listWorkspacesForProjectMoveAction(),
      supabase.from("workspaces").select("name").eq("id", project.workspace_id).single(),
    ]);
    moveTargets = moveList.error ? [] : moveList.data;
    currentWorkspaceName = wsRes.data?.name ?? "—";
    [commentsRes, filesRes, tasksRes, updatesRes] = detail;
  } else {
    [commentsRes, filesRes, tasksRes, updatesRes] = await detailBundle;
  }

  const comments = commentsRes.data;
  const files = filesRes.data;
  const tasks = tasksRes.data;
  const updates = updatesRes.data;
  const currentUserId = user?.id;

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
            currentUserId={currentUserId}
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
            currentUserId={currentUserId}
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

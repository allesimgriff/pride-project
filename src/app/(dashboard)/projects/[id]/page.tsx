import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { DetailBackLink } from "@/components/projects/DetailBackLink";
import { ProjectDetailHeader } from "@/components/projects/ProjectDetailHeader";
import { ProjectStammdaten } from "@/components/projects/ProjectStammdaten";
import { ProjectFiles } from "@/components/projects/ProjectFiles";
import { ProjectComments } from "@/components/projects/ProjectComments";
import { ProjectTasks } from "@/components/projects/ProjectTasks";
import { ProjectTimeline } from "@/components/projects/ProjectTimeline";
import { ProjectHistory } from "@/components/projects/ProjectHistory";
import { ProjectPhotosBlock } from "@/components/projects/ProjectPhotosBlock";
import { buildMergedProjectLabelMap } from "@/lib/projectLabelDefaults";
import { canEditWorkspaceLabels, canManageProjectAsAdmin } from "@/lib/workspacePermissions";
import { listWorkspacesForProjectMoveAction } from "@/app/actions/workspaces";
import { ProjectWorkspaceMove } from "@/components/projects/ProjectWorkspaceMove";
import { getAuthUser } from "@/lib/auth/cachedDashboardSession";
import { SetWorkspaceHeader } from "@/components/layout/SetWorkspaceHeader";
import { resolveAppEdition } from "@/lib/appEdition";

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const projectRes = await supabase.from("projects").select("*").eq("id", id).single();

  if (projectRes.error || !projectRes.data) {
    notFound();
  }
  const project = projectRes.data;

  const [user, labelsRes, wsLabelsRes, categoriesRes] = await Promise.all([
    getAuthUser(),
    supabase.from("project_labels").select("key,label_de,label_en"),
    supabase
      .from("workspace_project_labels")
      .select("key,label_de,label_en")
      .eq("workspace_id", project.workspace_id),
    supabase
      .from("project_categories")
      .select("id, name, prefix, sort_order, workspace_id")
      .eq("workspace_id", project.workspace_id)
      .order("sort_order", { ascending: true }),
  ]);

  const projectLabels = buildMergedProjectLabelMap(labelsRes.data || [], wsLabelsRes.data || []);
  const categories = categoriesRes.data;

  const canEdit = Boolean(
    user && (await canManageProjectAsAdmin(supabase, user.id, project.workspace_id ?? null)),
  );
  let canEditLabels = false;
  if (user && project.workspace_id) {
    canEditLabels = await canEditWorkspaceLabels(supabase, user.id, project.workspace_id);
  }
  const workspaceId = project.workspace_id ?? null;
  const legacyPhotosPromise = user
    ? supabase.from("photos").select("id, created_at").eq("user_id", user.id).order("created_at", { ascending: false })
    : Promise.resolve({ data: [], error: null });

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
    legacyPhotosPromise,
  ]);

  let moveTargets: { id: string; name: string }[] = [];
  let currentWorkspaceName = "";

  let commentsRes: Awaited<typeof detailBundle>[0];
  let filesRes: Awaited<typeof detailBundle>[1];
  let tasksRes: Awaited<typeof detailBundle>[2];
  let updatesRes: Awaited<typeof detailBundle>[3];
  let legacyPhotosRes: Awaited<typeof detailBundle>[4];

  if (canEdit && project.workspace_id) {
    const [detail, moveList, wsRes] = await Promise.all([
      detailBundle,
      listWorkspacesForProjectMoveAction(),
      supabase.from("workspaces").select("name").eq("id", project.workspace_id).single(),
    ]);
    moveTargets = moveList.error ? [] : moveList.data;
    currentWorkspaceName = wsRes.data?.name ?? "—";
    [commentsRes, filesRes, tasksRes, updatesRes, legacyPhotosRes] = detail;
  } else {
    [commentsRes, filesRes, tasksRes, updatesRes, legacyPhotosRes] = await detailBundle;
  }

  const comments = commentsRes.data;
  const files = filesRes.data;
  const tasks = tasksRes.data;
  const updates = updatesRes.data;
  const legacyPhotos = legacyPhotosRes.data || [];
  const currentUserId = user?.id;
  const prideUi = (await resolveAppEdition()) === "pride";

  return (
    <div className="space-y-6 print-detail-page">
      <SetWorkspaceHeader workspaceId={project.workspace_id} />
      <div className="no-print flex items-center gap-4">
        <DetailBackLink />
      </div>

      <ProjectDetailHeader project={project} />

      {canEdit && prideUi ? (
        <ProjectWorkspaceMove
          projectId={id}
          currentWorkspaceId={project.workspace_id}
          currentWorkspaceName={currentWorkspaceName}
          targets={moveTargets}
        />
      ) : null}

      <div className="grid gap-6 lg:grid-cols-3 print-grid">
        <div className="lg:col-span-2 space-y-6 print-main-column">
          {prideUi ? (
            <ProjectPhotosBlock
              projectId={id}
              projectLabels={projectLabels}
              workspaceId={workspaceId}
              canEditLabels={canEditLabels}
            />
          ) : null}

          <ProjectFiles
            projectId={id}
            files={files || []}
            projectImageId={project.project_image_id ?? null}
            projectLabels={projectLabels}
            workspaceId={workspaceId}
            canEditLabels={canEditLabels}
          />
          <ProjectStammdaten
            project={project}
            categories={categories || []}
            canEdit={canEdit}
            projectLabels={projectLabels}
            workspaceId={workspaceId}
            canEditLabels={canEditLabels}
          />
          <ProjectComments
            projectId={id}
            comments={comments || []}
            currentUserId={currentUserId}
            projectLabels={projectLabels}
            workspaceId={workspaceId}
            canEditLabels={canEditLabels}
          />
          <ProjectTasks
            projectId={id}
            tasks={tasks || []}
            projectImages={(files || []).filter((f) => (f.mime_type || "").startsWith("image/"))}
            legacyPhotos={legacyPhotos}
            currentUserId={currentUserId}
            projectLabels={projectLabels}
            workspaceId={workspaceId}
            canEditLabels={canEditLabels}
          />
        </div>
        <div className="no-print space-y-6">
          <ProjectTimeline
            projectId={id}
            comments={comments || []}
            updates={updates || []}
            files={files || []}
            projectLabels={projectLabels}
            workspaceId={workspaceId}
            canEditLabels={canEditLabels}
          />
          <ProjectHistory
            projectId={id}
            updates={updates || []}
            projectLabels={projectLabels}
            workspaceId={workspaceId}
            canEditLabels={canEditLabels}
          />
        </div>
      </div>
    </div>
  );
}

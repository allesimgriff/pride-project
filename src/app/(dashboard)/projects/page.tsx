import { createClient } from "@/lib/supabase/server";
import { ProjectsList } from "@/components/projects/ProjectsList";
import { ProjectsPageHeader } from "@/components/projects/ProjectsPageHeader";
import { ProjectsScopeHint } from "@/components/projects/ProjectsScopeHint";
import type { ProjectStatus } from "@/types/database";
import { getDashboardSession } from "@/lib/auth/cachedDashboardSession";
import { mapFirstFileIdByProjectId } from "@/lib/supabase/firstFileThumbs";

/** Zeile aus projects-Select inkl. workspaces-Embed */
type ProjectListQueryRow = {
  id: string;
  workspace_id: string;
  dev_number: string;
  product_name: string;
  category: string | null;
  status: ProjectStatus;
  updated_at: string;
  project_image_id: string | null;
  workspaces?: { name: string } | { name: string }[] | null;
};

export default async function ProjectsPage() {
  const session = await getDashboardSession();
  const user = session?.user;
  const profile = session?.profile ?? null;

  const supabase = await createClient();

  const isAdmin = profile?.role === "admin";

  let workspaceIds: string[] = [];
  if (user) {
    const { data: mids, error: midsErr } = await supabase
      .from("workspace_members")
      .select("workspace_id")
      .eq("user_id", user.id);
    if (midsErr && process.env.NODE_ENV === "development") {
      // eslint-disable-next-line no-console
      console.error("[projects/page] workspace_members", midsErr.message);
    }
    workspaceIds = [...new Set((mids ?? []).map((m) => m.workspace_id as string))];
  }

  const projectSelect =
    "id, dev_number, product_name, category, status, updated_at, project_image_id, workspace_id, workspaces ( name )";

  // Projekte nur über RLS filtern (user_in_workspace / App-Admin). Kein .in(workspace_id),
  // damit die Liste nicht leer bleibt, falls workspace_members clientseitig leer zurückkommt.
  const [projectsRes, categoryRes] = await Promise.all([
    supabase.from("projects").select(projectSelect).order("updated_at", { ascending: false }),
    supabase.from("project_categories").select("workspace_id, name, prefix").order("sort_order", { ascending: true }),
  ]);

  const projectCount = projectsRes.data?.length ?? 0;
  const inAnyWorkspace = workspaceIds.length > 0 || projectCount > 0;

  if (process.env.NODE_ENV === "development" && projectsRes.error) {
    // eslint-disable-next-line no-console
    console.error("[projects/page]", projectsRes.error.message);
  }

  const canCreateProject = isAdmin || inAnyWorkspace;
  const projects = projectsRes.data;
  const categoryRows = categoryRes.data ?? [];
  const categoriesByWorkspace: Record<string, { name: string; prefix: string }[]> = {};
  for (const row of categoryRows) {
    const wid = row.workspace_id as string;
    if (!categoriesByWorkspace[wid]) categoriesByWorkspace[wid] = [];
    categoriesByWorkspace[wid].push({ name: row.name, prefix: row.prefix });
  }

  const projectRows = (projects ?? []) as ProjectListQueryRow[];
  const projectIds = projectRows.map((p) => p.id);
  const thumbByProjectId = await mapFirstFileIdByProjectId(supabase, projectIds);

  const projectsWithThumbs = projectRows.map((p) => {
    const raw = p;
    const w = raw.workspaces;
    const workspaceName = Array.isArray(w) ? w[0]?.name : w?.name;
    return {
      id: raw.id,
      workspace_id: raw.workspace_id,
      dev_number: raw.dev_number,
      product_name: raw.product_name,
      category: raw.category,
      status: raw.status,
      updated_at: raw.updated_at,
      project_image_id: raw.project_image_id ?? thumbByProjectId[raw.id] ?? null,
      workspace_name: workspaceName ?? null,
    };
  });

  const loadError =
    projectsRes.error != null
      ? process.env.NODE_ENV === "development"
        ? projectsRes.error.message
        : "Projekte konnten nicht geladen werden."
      : null;

  return (
    <div className="space-y-6">
      <ProjectsPageHeader canCreateProject={canCreateProject} />
      {loadError != null && (
        <p className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {loadError}
        </p>
      )}
      {Boolean(profile) && (
        <ProjectsScopeHint isAdmin={Boolean(isAdmin)} inAnyWorkspace={inAnyWorkspace} />
      )}
      <ProjectsList
        projects={projectsWithThumbs}
        categoriesByWorkspace={categoriesByWorkspace}
        isAdmin={Boolean(isAdmin)}
        inAnyWorkspace={inAnyWorkspace}
        canCreateProject={canCreateProject}
      />
    </div>
  );
}

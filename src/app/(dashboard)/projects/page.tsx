import { createClient } from "@/lib/supabase/server";
import { ProjectsList } from "@/components/projects/ProjectsList";
import { ProjectsPageHeader } from "@/components/projects/ProjectsPageHeader";
import { ProjectsScopeHint } from "@/components/projects/ProjectsScopeHint";
import type { ProjectStatus } from "@/types/database";
import { getDashboardSession } from "@/lib/auth/cachedDashboardSession";
import { mapFirstFileIdByProjectId } from "@/lib/supabase/firstFileThumbs";

export default async function ProjectsPage() {
  const session = await getDashboardSession();
  const user = session?.user;
  const profile = session?.profile ?? null;

  const supabase = await createClient();

  const [workspaceRes, projectsRes, categoryRes] = await Promise.all([
    user
      ? supabase
          .from("workspace_members")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.id)
      : Promise.resolve({ count: 0 }),
    supabase
      .from("projects")
      .select(
        "id, dev_number, product_name, category, status, updated_at, project_image_id, workspace_id, workspaces ( name )",
      )
      .order("updated_at", { ascending: false }),
    supabase
      .from("project_categories")
      .select("name, prefix")
      .order("sort_order", { ascending: true }),
  ]);

  const isAdmin = profile?.role === "admin";
  const workspaceMembershipCount = workspaceRes.count;
  const canCreateProject = isAdmin || (workspaceMembershipCount ?? 0) > 0;
  const projects = projectsRes.data;
  const categoryList = categoryRes.data;

  const projectRows = projects || [];
  const projectIds = projectRows.map((p) => p.id);
  const thumbByProjectId = await mapFirstFileIdByProjectId(supabase, projectIds);

  const projectsWithThumbs = projectRows.map((p) => {
    const raw = p as {
      id: string;
      dev_number: string;
      product_name: string;
      category: string | null;
      status: ProjectStatus;
      updated_at: string;
      project_image_id: string | null;
      workspaces?: { name: string } | { name: string }[] | null;
    };
    const w = raw.workspaces;
    const workspaceName = Array.isArray(w) ? w[0]?.name : w?.name;
    return {
      id: raw.id,
      dev_number: raw.dev_number,
      product_name: raw.product_name,
      category: raw.category,
      status: raw.status,
      updated_at: raw.updated_at,
      project_image_id: raw.project_image_id ?? thumbByProjectId[raw.id] ?? null,
      workspace_name: workspaceName ?? null,
    };
  });

  return (
    <div className="space-y-6">
      <ProjectsPageHeader canCreateProject={canCreateProject} />
      {Boolean(profile) && <ProjectsScopeHint />}
      <ProjectsList projects={projectsWithThumbs} categoryNames={categoryList || []} />
    </div>
  );
}

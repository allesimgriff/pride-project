import { createClient } from "@/lib/supabase/server";
import { ProjectsList } from "@/components/projects/ProjectsList";
import { ProjectsPageHeader } from "@/components/projects/ProjectsPageHeader";
import { ProjectsScopeHint } from "@/components/projects/ProjectsScopeHint";
import type { ProjectStatus } from "@/types/database";

export default async function ProjectsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [profileRes, workspaceRes, projectsRes, categoryRes] = await Promise.all([
    user
      ? supabase.from("profiles").select("role").eq("id", user.id).single()
      : Promise.resolve({ data: null }),
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

  const profile = profileRes.data;
  const isAdmin = profile?.role === "admin";
  const workspaceMembershipCount = workspaceRes.count;
  const canCreateProject = isAdmin || (workspaceMembershipCount ?? 0) > 0;
  const projects = projectsRes.data;
  const categoryList = categoryRes.data;

  const projectRows = projects || [];

  // Wenn `project_image_id` bei Projekten noch leer ist, laden wir einmalig das erste File pro Projekt
  // (statt pro Karte im Browser erneut zu suchen).
  const projectIds = projectRows.map((p) => p.id);
  const thumbByProjectId: Record<string, string> = {};

  if (projectIds.length > 0) {
    const { data: projectFiles } = await supabase
      .from("project_files")
      .select("id, project_id, created_at")
      .in("project_id", projectIds)
      .order("created_at", { ascending: true });

    (projectFiles || []).forEach((f) => {
      if (!thumbByProjectId[f.project_id]) thumbByProjectId[f.project_id] = f.id;
    });
  }

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

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { listMyWorkspacesAction } from "@/app/actions/workspaces";
import { isAppAdmin } from "@/lib/workspacePermissions";
import { PageTitle } from "@/components/layout/PageTitle";
import { WorkspacesPageClient } from "@/components/workspaces/WorkspacesPageClient";

export default async function WorkspacesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const appAdmin = await isAppAdmin(supabase, user.id);

  let workspaces: { id: string; name: string }[] = [];
  let listError: string | null = null;

  if (appAdmin) {
    const { data: all, error } = await supabase.from("workspaces").select("id, name").order("name");
    if (error) listError = error.message;
    else workspaces = all ?? [];
  } else {
    const { data: mine, error } = await listMyWorkspacesAction();
    if (error) listError = error;
    else workspaces = (mine ?? []).map((w) => ({ id: w.id, name: w.name }));
  }

  if (listError) {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <PageTitle titleKey="workspaces.title" subtitleKey="workspaces.subtitleMember" />
        <p className="text-sm text-red-600">{listError}</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageTitle
        titleKey="workspaces.title"
        subtitleKey={appAdmin ? "workspaces.subtitleAppAdmin" : "workspaces.subtitleMember"}
      />
      <WorkspacesPageClient workspaces={workspaces} />
    </div>
  );
}

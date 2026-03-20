import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { PageTitle } from "@/components/layout/PageTitle";
import { WorkspacesPageClient } from "@/components/workspaces/WorkspacesPageClient";

export default async function WorkspacesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: workspaces } = await supabase.from("workspaces").select("id, name").order("name");

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageTitle titleKey="workspaces.title" subtitleKey="workspaces.subtitle" />
      <WorkspacesPageClient workspaces={workspaces ?? []} />
    </div>
  );
}

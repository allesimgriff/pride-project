import { createClient } from "@/lib/supabase/server";
import { resolveAppEdition } from "@/lib/appEdition";
import { JoinWorkspaceShell } from "@/components/workspaces/JoinWorkspaceShell";

/** Außerhalb des Dashboards: Kein Login-Zwang beim Öffnen des Links (siehe JoinWorkspaceClient). */
export default async function JoinWorkspacePage() {
  const edition = await resolveAppEdition();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return <JoinWorkspaceShell edition={edition} isLoggedIn={Boolean(user)} />;
}

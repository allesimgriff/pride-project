import { createClient } from "@/lib/supabase/server";
import { resolveAppEdition } from "@/lib/appEdition";
import { JoinWorkspaceShell } from "@/components/workspaces/JoinWorkspaceShell";

/** Öffentliche Join-Seite (Pfad-Token): /workspaces/join/[token] */
export default async function JoinWorkspaceTokenPage() {
  const edition = await resolveAppEdition();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return <JoinWorkspaceShell edition={edition} isLoggedIn={Boolean(user)} />;
}

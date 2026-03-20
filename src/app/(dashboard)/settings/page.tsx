import { createClient } from "@/lib/supabase/server";
import { SettingsHubClient } from "@/components/settings/SettingsHubClient";

export default async function SettingsHubPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profile } = user
    ? await supabase.from("profiles").select("role").eq("id", user.id).single()
    : { data: null };
  const isAdmin = profile?.role === "admin";

  return <SettingsHubClient isAdmin={isAdmin} />;
}

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ProfileForm } from "@/components/settings/ProfileForm";
import { PageTitle } from "@/components/layout/PageTitle";

export default async function ProfilePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, full_name, email, avatar_url")
    .eq("id", user.id)
    .single();

  return (
    <div className="space-y-6">
      <PageTitle titleKey="profile.title" subtitleKey="profile.subtitle" />
      <ProfileForm
        fullName={profile?.full_name ?? ""}
        email={user.email ?? ""}
        avatarUrl={profile?.avatar_url ?? null}
      />
    </div>
  );
}

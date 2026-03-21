import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { PageTitle } from "@/components/layout/PageTitle";
import { StaffManager } from "@/components/settings/StaffManager";

export default async function StaffPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "admin") {
    redirect("/projects");
  }

  return (
    <div className="space-y-6">
      <PageTitle titleKey="staffPage.title" subtitleKey="staffPage.subtitle" />
      <StaffManager />
    </div>
  );
}


import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/layout/DashboardShell";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login?redirectTo=" + encodeURIComponent("/dashboard"));
  }

  let { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile) {
    await supabase.from("profiles").upsert(
      {
        id: user.id,
        email: user.email ?? "",
        full_name: user.user_metadata?.full_name ?? user.email ?? "",
        role: "entwicklung",
      },
      { onConflict: "id" }
    );
    const res = await supabase.from("profiles").select("*").eq("id", user.id).single();
    profile = res.data;
  }

  const isAdmin = profile?.role === "admin";

  return (
    <DashboardShell
      isAdmin={isAdmin}
      user={user}
      profile={profile}
    >
      {children}
    </DashboardShell>
  );
}

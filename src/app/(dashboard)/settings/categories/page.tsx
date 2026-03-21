import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { CategoriesManager } from "@/components/settings/CategoriesManager";
import { PageTitle } from "@/components/layout/PageTitle";

export default async function CategoriesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") {
    redirect("/projects");
  }

  const { data: categories } = await supabase
    .from("project_categories")
    .select("*")
    .order("sort_order", { ascending: true });

  return (
    <div className="space-y-6">
      <PageTitle titleKey="categoriesPage.title" subtitleKey="categories.subtitle" />
      <CategoriesManager categories={categories ?? []} />
    </div>
  );
}

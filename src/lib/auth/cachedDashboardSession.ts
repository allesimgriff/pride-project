import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { User } from "@supabase/supabase-js";
import type { Profile } from "@/types/database";

export type DashboardSession = {
  user: User;
  profile: Profile | null;
};

/** Pro Request nur einmal: Supabase getUser() (Middleware macht eigenes Refresh). */
export const getAuthUser = cache(async (): Promise<User | null> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user ?? null;
});

/** Layout + Seiten: User inkl. Profil; mehrfacher Aufruf im gleichen Request = Cache-Treffer. */
export const getDashboardSession = cache(async (): Promise<DashboardSession | null> => {
  const user = await getAuthUser();
  if (!user) return null;

  const supabase = await createClient();
  let { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();

  if (!profile) {
    await supabase.from("profiles").upsert(
      {
        id: user.id,
        email: user.email ?? "",
        full_name: user.user_metadata?.full_name ?? user.email ?? "",
        role: "entwicklung",
      },
      { onConflict: "id" },
    );
    const res = await supabase.from("profiles").select("*").eq("id", user.id).single();
    profile = res.data;
  }

  return { user, profile: profile ?? null };
});

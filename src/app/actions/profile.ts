"use server";

import { createClient } from "@/lib/supabase/server";

export async function updateProfileAction(formData: FormData) {
  const supabase = await createClient();
  const { data: user } = (await supabase.auth.getUser()).data;
  if (!user) return { error: "Nicht angemeldet" };

  const full_name = (formData.get("full_name") as string)?.trim() ?? null;
  const avatarFile = formData.get("avatar") as File | null;

  const updates: { full_name?: string; avatar_url?: string | null } = {};
  if (full_name !== null) updates.full_name = full_name || null;

  if (avatarFile?.size && avatarFile.size > 0) {
    const ext = avatarFile.name.split(".").pop()?.toLowerCase() || "jpg";
    const path = `${user.id}/avatar.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(path, avatarFile, { upsert: true });
    if (uploadError) return { error: uploadError.message };
    const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path);
    updates.avatar_url = urlData.publicUrl;
  }

  if (Object.keys(updates).length === 0) return {};

  const { error } = await supabase
    .from("profiles")
    .update(updates)
    .eq("id", user.id);
  if (error) return { error: error.message };
  return {};
}

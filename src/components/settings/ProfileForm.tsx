"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useApp } from "@/components/providers/AppProvider";
import { getT } from "@/lib/i18n";
import { createClient } from "@/lib/supabase/client";

interface ProfileFormProps {
  fullName: string;
  email: string;
  avatarUrl: string | null;
}

function getInitials(name: string, email: string) {
  if (name?.trim()) {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return name.trim().slice(0, 2).toUpperCase();
  }
  if (email) return email.slice(0, 2).toUpperCase();
  return "?";
}

export function ProfileForm({ fullName, email, avatarUrl }: ProfileFormProps) {
  const router = useRouter();
  const { lang } = useApp();
  const t = getT(lang);
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState(fullName);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
  };

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const supabase = createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setLoading(false);
      alert("Nicht angemeldet");
      return;
    }

    let newAvatarUrl: string | null | undefined = avatarUrl;

    const file = fileRef.current?.files?.[0] ?? null;
    if (file) {
      const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const path = `${user.id}/avatar.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(path, file, { upsert: true });
      if (uploadError) {
        setLoading(false);
        alert(uploadError.message);
        return;
      }
      const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path);
      newAvatarUrl = urlData.publicUrl;
    }

    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: name || null,
        avatar_url: newAvatarUrl ?? null,
      })
      .eq("id", user.id);

    setLoading(false);
    if (error) {
      alert(error.message);
      return;
    }
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    if (fileRef.current) fileRef.current.value = "";
    router.refresh();
  }

  const showImage = previewUrl || avatarUrl;
  const initials = getInitials(name, email);

  return (
    <div className="card p-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
          {/* Profilbild */}
          <div className="flex flex-col items-center gap-3">
            <div className="relative h-24 w-24 overflow-hidden rounded-full border-2 border-gray-200 bg-gray-100">
              {showImage ? (
                <Image
                  src={previewUrl || avatarUrl!}
                  alt=""
                  width={96}
                  height={96}
                  className="h-full w-full object-cover"
                  unoptimized={!!previewUrl}
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-2xl font-semibold text-gray-500">
                  {initials}
                </div>
              )}
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">{t("profile.image")}</label>
              <p className="text-xs text-gray-500">{t("profile.imageHint")}</p>
              <input
                ref={fileRef}
                type="file"
                name="avatar"
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={handleFileChange}
                className="mt-1 block w-full text-sm text-gray-500 file:mr-2 file:rounded file:border-0 file:bg-primary-50 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-primary-700 hover:file:bg-primary-100"
              />
            </div>
          </div>

          <div className="min-w-0 flex-1 space-y-4">
            <div>
              <label htmlFor="full_name" className="block text-sm font-medium text-gray-700">
                {t("profile.name")}
              </label>
              <input
                id="full_name"
                name="full_name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="input-base mt-1 w-full"
                placeholder={t("profile.name")}
              />
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                {t("profile.email")}
              </label>
              <input
                id="email"
                type="email"
                value={email}
                readOnly
                disabled
                className="input-base mt-1 w-full bg-gray-50 text-gray-600"
              />
              <p className="mt-1 text-xs text-gray-500">
                {t("profile.emailHint")}
              </p>
            </div>
          </div>
        </div>

        <div className="flex justify-end border-t border-gray-100 pt-4">
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? t("profile.saving") : t("profile.save")}
          </button>
        </div>
      </form>
    </div>
  );
}

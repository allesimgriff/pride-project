"use client";

import Link from "next/link";
import Image from "next/image";
import type { User } from "@supabase/supabase-js";
import type { Profile } from "@/types/database";
import { useApp } from "@/components/providers/AppProvider";
import { getT } from "@/lib/i18n";

interface HeaderProps {
  user: User;
  profile: Profile | null;
}

function getInitials(profile: Profile | null, user: User) {
  const name = profile?.full_name?.trim();
  if (name) {
    const parts = name.split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return name.slice(0, 2).toUpperCase();
  }
  const email = user.email ?? "";
  return email ? email.slice(0, 2).toUpperCase() : "?";
}

export function Header({ user, profile }: HeaderProps) {
  const { lang, setLang } = useApp();
  const t = getT(lang);
  const displayName = profile?.full_name || user.email?.split("@")[0] || t("header.user");
  const roleLabel = profile ? t(`roles.${profile.role}`) : "—";
  const avatarUrl = profile?.avatar_url ?? null;
  const initials = getInitials(profile, user);

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-gray-200 bg-white px-6">
      <div className="flex items-center gap-4">
        <h1 className="text-lg font-semibold text-gray-900">
          {t("header.title")}
        </h1>
      </div>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setLang("de")}
            className={`rounded px-2 py-1 text-sm font-medium ${
              lang === "de" ? "bg-primary-100 text-primary-800" : "text-gray-500 hover:bg-gray-100"
            }`}
          >
            DE
          </button>
          <button
            type="button"
            onClick={() => setLang("en")}
            className={`rounded px-2 py-1 text-sm font-medium ${
              lang === "en" ? "bg-primary-100 text-primary-800" : "text-gray-500 hover:bg-gray-100"
            }`}
          >
            EN
          </button>
        </div>
        <Link
          href="/settings/profile"
          className="hidden items-center gap-3 sm:flex"
          title={displayName}
        >
          <div className="flex h-9 w-9 shrink-0 overflow-hidden rounded-full border border-gray-200 bg-gray-100">
            {avatarUrl ? (
              <Image
                src={avatarUrl}
                alt=""
                width={36}
                height={36}
                className="h-full w-full object-cover"
                unoptimized
              />
            ) : (
              <span className="flex h-full w-full items-center justify-center text-sm font-medium text-gray-600">
                {initials}
              </span>
            )}
          </div>
          <div className="text-right">
            <p className="text-sm font-medium text-gray-900">{displayName}</p>
            <p className="text-xs text-gray-500">{roleLabel}</p>
          </div>
        </Link>
      </div>
    </header>
  );
}

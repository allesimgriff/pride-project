"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import type { Profile } from "@/types/database";
import { useApp } from "@/components/providers/AppProvider";
import { getT } from "@/lib/i18n";
import { primaryNavItems, isPrimaryNavActive } from "@/components/layout/navConfig";
import { LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

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
  const router = useRouter();
  const t = getT(lang);
  const displayName = profile?.full_name || user.email?.split("@")[0] || t("header.user");
  const roleLabel = profile ? t(`roles.${profile.role}`) : "—";
  const avatarUrl = profile?.avatar_url ?? null;
  const initials = getInitials(profile, user);
  const pathname = usePathname();
  const navItems = primaryNavItems;

  return (
    <header className="sticky top-0 z-30 border-b border-gray-200 bg-white">
      <div className="flex h-16 items-center justify-between px-4 md:px-6">
        <div className="flex items-center gap-4">
          <h1 className="text-base md:text-lg font-semibold text-gray-900">
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
          <button
            type="button"
            title={t("nav.signOut")}
            onClick={async () => {
              const supabase = createClient();
              await supabase.auth.signOut();
              router.refresh();
              window.location.href = "/login";
            }}
            className="inline-flex items-center justify-center rounded-full p-2 text-gray-600 hover:bg-gray-100 hover:text-gray-900"
          >
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Mobile: horizontale Navigation unter der Kopfzeile */}
      <nav className="flex md:hidden border-t border-gray-200 px-1 pb-1 pt-1 overflow-x-auto bg-white">
        {navItems.map((item) => {
          const isActive = isPrimaryNavActive(pathname, item);
          const Icon = item.icon;
          const label = t(item.labelKey);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center px-3 py-1.5 text-xs font-medium rounded-lg min-w-[72px] ${
                isActive
                  ? "text-primary-700 bg-primary-50"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              }`}
              title={label}
            >
              <Icon className="h-4 w-4 mb-0.5" />
              <span className="truncate">{label}</span>
            </Link>
          );
        })}
      </nav>
    </header>
  );
}

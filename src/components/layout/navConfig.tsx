import { FolderKanban, Settings, User, type LucideIcon } from "lucide-react";

export type PrimaryNavItem = {
  href: string;
  labelKey: string;
  icon: LucideIcon;
  /** „Einstellungen“-Hub inkl. Workspaces- und Admin-Pfade unter /settings/* */
  match: "default" | "settings" | "profile";
};

export const primaryNavItems: PrimaryNavItem[] = [
  { href: "/projects", labelKey: "nav.projects", icon: FolderKanban, match: "default" },
  { href: "/settings", labelKey: "nav.settings", icon: Settings, match: "settings" },
  { href: "/settings/profile", labelKey: "nav.profile", icon: User, match: "profile" },
];

export function isPrimaryNavActive(pathname: string, item: PrimaryNavItem): boolean {
  if (item.match === "settings") {
    return (
      pathname === "/settings" ||
      pathname.startsWith("/workspaces") ||
      pathname.startsWith("/settings/staff")
    );
  }
  if (item.match === "profile") {
    return pathname.startsWith("/settings/profile");
  }
  if (item.href === "/projects") {
    return pathname === "/projects" || pathname.startsWith("/projects/");
  }
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}

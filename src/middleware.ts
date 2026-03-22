import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { isHandwerkerEdition } from "@/lib/appEdition";

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  if (isHandwerkerEdition()) {
    const allowedWorkspacesPath = path.startsWith("/workspaces/join");
    if (path === "/workspaces" || (path.startsWith("/workspaces/") && !allowedWorkspacesPath)) {
      return NextResponse.redirect(new URL("/projects", request.url));
    }
  }
  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Session-Refresh weglassen für alles unter /_next/ (Chunks, CSS, HMR, …) und Bild-APIs.
     */
    "/((?!_next/|favicon.ico|api/files|api/photos|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};

import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
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

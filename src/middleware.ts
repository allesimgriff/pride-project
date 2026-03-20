import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Session-Refresh weglassen für statische Assets und Bild-APIs (sonst pro Thumbnail
     * ein zusätzlicher Supabase-auth/User-Roundtrip).
     */
    "/((?!_next/static|_next/image|favicon.ico|api/files|api/photos|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};

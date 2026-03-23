import { NextResponse } from "next/server";
import { getAppEdition, resolveAppEdition } from "@/lib/appEdition";

/** Einmal im Browser öffnen: effektive Edition (Host) vs. Env. Nicht geheim (NEXT_PUBLIC_* im Bundle). */
export async function GET() {
  const resolved = await resolveAppEdition();
  return NextResponse.json({
    edition: resolved,
    envEdition: getAppEdition(),
    raw: process.env.NEXT_PUBLIC_APP_EDITION?.trim() ?? null,
  });
}

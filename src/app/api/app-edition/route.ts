import { NextResponse } from "next/server";
import { getAppEdition, resolveAppEdition } from "@/lib/appEdition";

/** GET /api/app-edition — effektive Edition (Host) + Env-Rohwert. */
export async function GET() {
  const resolved = await resolveAppEdition();
  return NextResponse.json({
    edition: resolved,
    envEdition: getAppEdition(),
    raw: process.env.NEXT_PUBLIC_APP_EDITION?.trim() ?? null,
  });
}

import { NextResponse } from "next/server";
import { getAppEdition } from "@/lib/appEdition";

/** GET /api/app-edition — laufender Build (gleiche Logik wie getAppEdition). */
export async function GET() {
  return NextResponse.json({
    edition: getAppEdition(),
    raw: process.env.NEXT_PUBLIC_APP_EDITION?.trim() ?? null,
  });
}

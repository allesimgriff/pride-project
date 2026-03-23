import { NextResponse } from "next/server";
import { getAppEdition } from "@/lib/appEdition";

/** Einmal im Browser öffnen: laufender Build vs. Netlify-Dashboard. Nicht geheim (steht ohnehin im Client-Bundle). */
export async function GET() {
  return NextResponse.json({
    edition: getAppEdition(),
    raw: process.env.NEXT_PUBLIC_APP_EDITION?.trim() ?? null,
  });
}

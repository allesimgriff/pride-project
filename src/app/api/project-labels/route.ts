import { NextResponse } from "next/server";
import { saveProjectLabelAction } from "@/app/actions/projectLabels";
import {
  deleteWorkspaceProjectLabelOverrideAction,
  saveWorkspaceProjectLabelAction,
} from "@/app/actions/workspaceProjectLabels";
import { PROJECT_LABEL_DEFAULTS, type ProjectLabelKey } from "@/lib/projectLabelDefaults";

type Body =
  | {
      kind: "global";
      action: "save";
      key: ProjectLabelKey;
      label_de: string;
      label_en: string;
    }
  | {
      kind: "global";
      action: "resetToDefault";
      key: ProjectLabelKey;
    }
  | {
      kind: "workspace";
      workspaceId: string;
      action: "save";
      key: ProjectLabelKey;
      label_de: string;
      label_en: string;
    }
  | {
      kind: "workspace";
      workspaceId: string;
      action: "deleteOverride";
      key: ProjectLabelKey;
    };

/** Keine Server-Actions im Client-Bundle (Header / Projekt-Überschriften). */
export async function POST(request: Request) {
  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Ungültige Anfrage." }, { status: 400 });
  }

  if (body.kind === "global" && body.action === "save") {
    const r = await saveProjectLabelAction({
      key: body.key,
      label_de: body.label_de,
      label_en: body.label_en,
    });
    if (r.error) return NextResponse.json({ error: r.error }, { status: 400 });
    return NextResponse.json({ ok: true });
  }

  if (body.kind === "global" && body.action === "resetToDefault") {
    const def = PROJECT_LABEL_DEFAULTS.find((d) => d.key === body.key);
    if (!def) return NextResponse.json({ error: "Unbekannter Label-Key." }, { status: 400 });
    const r = await saveProjectLabelAction({
      key: body.key,
      label_de: def.label_de,
      label_en: def.label_en,
    });
    if (r.error) return NextResponse.json({ error: r.error }, { status: 400 });
    return NextResponse.json({ ok: true });
  }

  if (body.kind === "workspace" && body.action === "save") {
    const r = await saveWorkspaceProjectLabelAction({
      workspaceId: body.workspaceId,
      key: body.key,
      label_de: body.label_de,
      label_en: body.label_en,
    });
    if (r.error) return NextResponse.json({ error: r.error }, { status: 400 });
    return NextResponse.json({ ok: true });
  }

  if (body.kind === "workspace" && body.action === "deleteOverride") {
    const r = await deleteWorkspaceProjectLabelOverrideAction({
      workspaceId: body.workspaceId,
      key: body.key,
    });
    if (r.error) return NextResponse.json({ error: r.error }, { status: 400 });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Unbekannte Aktion." }, { status: 400 });
}

import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

/** Liefert ein Bild zur Anzeige (z. B. als Projektbild-Thumbnail). Nur für Bildtypen. */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: file, error: fetchError } = await supabase
    .from("project_files")
    .select("file_path, mime_type")
    .eq("id", id)
    .single();

  if (fetchError || !file) {
    return NextResponse.json({ error: "Datei nicht gefunden" }, { status: 404 });
  }

  const mime = file.mime_type ?? "";
  if (!mime.startsWith("image/")) {
    return NextResponse.json({ error: "Kein Bild" }, { status: 400 });
  }

  const { data: blob, error: downloadError } = await supabase.storage
    .from("project-files")
    .download(file.file_path);

  if (downloadError || !blob) {
    return NextResponse.json(
      { error: "Bild konnte nicht geladen werden" },
      { status: 500 }
    );
  }

  return new NextResponse(blob, {
    headers: {
      "Content-Type": blob.type || mime || "image/jpeg",
      "Cache-Control": "private, max-age=300",
    },
  });
}

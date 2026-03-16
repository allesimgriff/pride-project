import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: file, error: fetchError } = await supabase
    .from("project_files")
    .select("file_path, file_name")
    .eq("id", id)
    .single();

  if (fetchError || !file) {
    return NextResponse.json({ error: "Datei nicht gefunden" }, { status: 404 });
  }

  const { data: blob, error: downloadError } = await supabase.storage
    .from("project-files")
    .download(file.file_path);

  if (downloadError || !blob) {
    return NextResponse.json(
      { error: "Download fehlgeschlagen" },
      { status: 500 }
    );
  }

  return new NextResponse(blob, {
    headers: {
      "Content-Disposition": `attachment; filename="${encodeURIComponent(file.file_name)}"`,
      "Content-Type": blob.type || "application/octet-stream",
    },
  });
}

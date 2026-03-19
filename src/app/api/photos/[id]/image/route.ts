import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

const BUCKET_NAME = "project-photos";

function objectPathFromImageUrl(imageUrl: string) {
  // Wir speichern in `photos.image_url` im Format: "project-photos/<userId>/<file>.jpg"
  const prefix = `${BUCKET_NAME}/`;
  if (imageUrl.startsWith(prefix)) return imageUrl.slice(prefix.length);
  return imageUrl;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: photo, error: fetchError } = await supabase
    .from("photos")
    .select("image_url")
    .eq("id", id)
    .single();

  if (fetchError || !photo) {
    return NextResponse.json({ error: "Foto nicht gefunden" }, { status: 404 });
  }

  const objectPath = objectPathFromImageUrl(photo.image_url);

  const { data: blob, error: downloadError } = await supabase.storage
    .from(BUCKET_NAME)
    .download(objectPath);

  if (downloadError || !blob) {
    return NextResponse.json(
      { error: "Bild konnte nicht geladen werden" },
      { status: 500 }
    );
  }

  return new NextResponse(blob, {
    headers: {
      "Content-Type": blob.type || "image/jpeg",
      "Cache-Control": "no-store",
    },
  });
}


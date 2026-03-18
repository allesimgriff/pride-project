"use server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabase/server";
import { randomUUID } from "crypto";

const BUCKET_NAME = "project-photos";
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/heic",
  "image/heif",
];

export type UploadPhotoResult = {
  error?: string;
  imageUrl?: string;
};

export async function uploadPhoto(formData: FormData): Promise<UploadPhotoResult> {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { error: "Nicht angemeldet." };
  }

  const file = formData.get("file") as Blob | null;
  if (!file) {
    return { error: "Keine Datei übergeben." };
  }

  if (file.size === 0) {
    return { error: "Die Datei ist leer." };
  }

  if (file.size > MAX_FILE_SIZE) {
    return { error: "Die Datei ist zu groß (max. 10 MB)." };
  }

  if (!ALLOWED_MIME_TYPES.includes((file as Blob).type)) {
    return { error: "Dieser Dateityp ist nicht erlaubt." };
  }

  const namedFile = file as Blob & { name?: string };
  const originalName = namedFile.name || "photo";
  const extMatch = originalName.match(/\.[a-zA-Z0-9]+$/);
  const extension = extMatch ? extMatch[0].toLowerCase() : "";
  const safeExtension =
    extension && [".jpg", ".jpeg", ".png", ".gif", ".webp", ".heic", ".heif"].includes(extension)
      ? extension
      : ".jpg";

  const objectPath = `${user.id}/${randomUUID()}${safeExtension}`;

  const { error: uploadError } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(objectPath, file, {
      cacheControl: "3600",
      upsert: false,
      contentType: (file as Blob).type || "image/jpeg",
    });

  if (uploadError) {
    return { error: `Fehler beim Hochladen: ${uploadError.message}` };
  }

  const imageUrl = `${BUCKET_NAME}/${objectPath}`;

  const { error: insertError } = await supabase.from("photos").insert({
    user_id: user.id,
    image_url: imageUrl,
  });

  if (insertError) {
    return { error: `Fehler beim Speichern des Fotos: ${insertError.message}` };
  }

  return { imageUrl };
}


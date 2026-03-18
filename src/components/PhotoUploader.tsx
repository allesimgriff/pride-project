"use client";

import { useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface PhotoUploaderProps {
  onUploaded?: (imageUrl: string) => void;
}

export function PhotoUploader({ onUploaded }: PhotoUploaderProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  function handleClickButton() {
    if (uploading) return;
    inputRef.current?.click();
  }

  async function handleChangeFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setError(null);
    setSuccess(null);
    setUploading(true);

    try {
      const supabase = createClient();
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        setError("Nicht angemeldet.");
        return;
      }

      if (!file.type.startsWith("image/")) {
        setError("Bitte nur Bilddateien hochladen.");
        return;
      }

      const MAX_SIZE = 10 * 1024 * 1024;
      if (file.size > MAX_SIZE) {
        setError("Die Datei ist zu groß (max. 10 MB).");
        return;
      }

      const originalName = file.name || "photo";
      const extMatch = originalName.match(/\.[a-zA-Z0-9]+$/);
      const extension = extMatch ? extMatch[0].toLowerCase() : ".jpg";
      const safeExtension =
        [".jpg", ".jpeg", ".png", ".gif", ".webp", ".heic", ".heif"].includes(extension)
          ? extension
          : ".jpg";

      const path = `${user.id}/${crypto.randomUUID()}${safeExtension}`;

      const uploadContentType = file.type || "image/jpeg";

      const { error: uploadError } = await supabase.storage
        .from("project-photos")
        .upload(path, file, {
          cacheControl: "3600",
          upsert: false,
          contentType: uploadContentType,
        });

      if (uploadError) {
        const err = uploadError as {
          message?: string;
          status?: number;
          code?: string;
          details?: string;
          hint?: string;
        };

        const details = [
          err.message ? `message: ${err.message}` : null,
          err.status != null ? `status: ${err.status}` : null,
          err.code ? `code: ${err.code}` : null,
          err.details ? `details: ${err.details}` : null,
          err.hint ? `hint: ${err.hint}` : null,
        ]
          .filter(Boolean)
          .join(" | ");

        setError(`Fehler beim Hochladen: ${details || uploadError.message}`);
        return;
      }

      const imageUrl = `project-photos/${path}`;

      const { error: insertError } = await supabase.from("photos").insert({
        user_id: user.id,
        image_url: imageUrl,
      });

      if (insertError) {
        setError(`Fehler beim Speichern des Fotos: ${insertError.message}`);
        return;
      }

      setSuccess("Foto erfolgreich hochgeladen.");
      if (onUploaded) {
        onUploaded(imageUrl);
      }
    } catch (e) {
      const message =
        e instanceof Error ? e.message : typeof e === "string" ? e : "Unbekannter Fehler beim Upload.";
      setError(message);
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  }

  return (
    <div className="space-y-3">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleChangeFile}
        className="hidden"
      />

      <button
        type="button"
        onClick={handleClickButton}
        disabled={uploading}
        className="inline-flex items-center justify-center rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {uploading ? "Lade Foto hoch…" : "Foto aufnehmen/hinzufügen"}
      </button>

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      {success && (
        <div className="rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
          {success}
        </div>
      )}
    </div>
  );
}

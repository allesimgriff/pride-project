"use client";

import { useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface PhotoUploaderProps {
  onUploaded?: (imageUrl: string) => void;
}

const MAX_DIMENSION = 1600; // reduziert deutlich die Upload-Größe
const OUTPUT_QUALITY = 0.78; // JPEG Qualität
const COMPRESS_MIN_SIZE = 1.5 * 1024 * 1024; // erst komprimieren ab ca. 1.5MB

function isCompressSupportedMime(mime: string) {
  return ["image/jpeg", "image/png", "image/webp", "image/gif"].includes(mime);
}

function extFromMime(mime: string) {
  if (mime === "image/png") return ".png";
  if (mime === "image/webp") return ".webp";
  if (mime === "image/gif") return ".gif";
  return ".jpg";
}

async function compressImageToJpeg(file: File): Promise<File> {
  // Keine Kompression wenn schon klein genug
  if (file.size <= COMPRESS_MIN_SIZE) return file;

  const originalMime = file.type || "image/jpeg";
  if (!isCompressSupportedMime(originalMime)) return file;

  const objectUrl = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.decoding = "async";
    img.src = objectUrl;

    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error("Bild konnte nicht geladen werden."));
    });

    const width = img.naturalWidth || img.width;
    const height = img.naturalHeight || img.height;

    if (!width || !height) return file;

    const maxSide = Math.max(width, height);
    const scale = maxSide > MAX_DIMENSION ? MAX_DIMENSION / maxSide : 1;
    const targetW = Math.max(1, Math.round(width * scale));
    const targetH = Math.max(1, Math.round(height * scale));

    const canvas = document.createElement("canvas");
    canvas.width = targetW;
    canvas.height = targetH;

    const ctx = canvas.getContext("2d");
    if (!ctx) return file;

    ctx.drawImage(img, 0, 0, targetW, targetH);

    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(
        (b) => resolve(b),
        "image/jpeg",
        OUTPUT_QUALITY,
      );
    });

    if (!blob) return file;

    const baseName = (file.name || "photo").replace(/\.[^/.]+$/, "");
    return new File([blob], `${baseName}.jpg`, { type: "image/jpeg" });
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

export function PhotoUploader({ onUploaded }: PhotoUploaderProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);
  const [compressing, setCompressing] = useState(false);
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

      let uploadFile: File = file;
      setCompressing(true);
      try {
        uploadFile = await compressImageToJpeg(file);
      } finally {
        setCompressing(false);
      }

      if (uploadFile.size > MAX_SIZE) {
        setError("Die Datei ist zu groß (max. 10 MB).");
        return;
      }

      const mimeForUpload = uploadFile.type || "image/jpeg";
      const safeExtension = extFromMime(mimeForUpload);
      const path = `${user.id}/${crypto.randomUUID()}${safeExtension}`;

      const uploadContentType = mimeForUpload;

      const { error: uploadError } = await supabase.storage
        .from("project-photos")
        .upload(path, uploadFile, {
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
        disabled={uploading || compressing}
        className="inline-flex items-center justify-center rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {uploading
          ? "Lade Foto hoch..."
          : compressing
            ? "Komprimiere Bild..."
            : "Foto aufnehmen/hinzufügen"}
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

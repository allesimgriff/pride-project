"use client";

import { useRef, useState, useTransition } from "react";
import type { UploadPhotoResult } from "@/app/actions/photos";
import { uploadPhoto } from "@/app/actions/photos";

interface PhotoUploaderProps {
  onUploaded?: (imageUrl: string) => void;
}

export function PhotoUploader({ onUploaded }: PhotoUploaderProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  function handleClickButton() {
    if (isPending) return;
    inputRef.current?.click();
  }

  function handleChangeFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    setError(null);
    setSuccess(null);

    startTransition(async () => {
      let result: UploadPhotoResult;
      try {
        result = await uploadPhoto(formData);
      } catch {
        setError("Unbekannter Fehler beim Upload.");
        event.target.value = "";
        return;
      }

      if (result.error) {
        setError(result.error);
        setSuccess(null);
      } else if (result.imageUrl) {
        setSuccess("Foto erfolgreich hochgeladen.");
        setError(null);
        if (onUploaded) {
          onUploaded(result.imageUrl);
        }
      }

      event.target.value = "";
    });
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
        disabled={isPending}
        className="inline-flex items-center justify-center rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending ? "Lade Foto hoch…" : "Foto aufnehmen/hinzufügen"}
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


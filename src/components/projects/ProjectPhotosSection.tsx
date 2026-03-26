"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { PhotoUploader } from "@/components/PhotoUploader";
import { deleteLegacyProjectPhotoAction, deleteProjectFileAction } from "@/app/actions/projects";

type PhotoRow = {
  id: string;
  created_at: string;
};

type FileImageRow = {
  id: string;
  file_name: string;
  created_at: string;
};

type GalleryItem = {
  id: string;
  created_at: string;
  source: "legacy" | "file";
  label: string;
};

export function ProjectPhotosSection({ projectId }: { projectId: string }) {
  const supabase = useMemo(() => createClient(), []);
  const [photos, setPhotos] = useState<PhotoRow[]>([]);
  const [fileImages, setFileImages] = useState<FileImageRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshTick, setRefreshTick] = useState(0);
  const [galleryExpanded, setGalleryExpanded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [failedPhotoIds, setFailedPhotoIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    let mounted = true;
    async function fetchPhotos() {
      setLoading(true);
      setError(null);
      try {
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
          if (!mounted) return;
          setPhotos([]);
          return;
        }

        const { data, error: photosError } = await supabase
          .from("photos")
          .select("id, created_at")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(200);

        if (photosError) {
          if (!mounted) return;
          setError(photosError.message);
          setPhotos([]);
          setFileImages([]);
          return;
        }

        const { data: fileData, error: fileError } = await supabase
          .from("project_files")
          .select("id, file_name, created_at, mime_type")
          .eq("project_id", projectId)
          .like("mime_type", "image/%")
          .order("created_at", { ascending: false });

        if (fileError) {
          if (!mounted) return;
          setError(fileError.message);
          setPhotos([]);
          setFileImages([]);
          return;
        }

        if (!mounted) return;
        setFailedPhotoIds(new Set());
        setPhotos((data || []) as PhotoRow[]);
        setFileImages((fileData || []) as FileImageRow[]);
      } catch (e) {
        if (!mounted) return;
        const message =
          e instanceof Error ? e.message : "Unbekannter Fehler beim Laden der Fotos.";
        setError(message);
      } finally {
        if (!mounted) return;
        setLoading(false);
      }
    }

    fetchPhotos();
    return () => {
      mounted = false;
    };
  }, [supabase, refreshTick, projectId]);

  async function handleDeletePhoto(photoId: string) {
    const ok = confirm("Bild wirklich löschen?");
    if (!ok) return;
    const res = await deleteLegacyProjectPhotoAction(projectId, photoId);
    if (res?.error) {
      alert(res.error);
      return;
    }
    setRefreshTick((t) => t + 1);
  }

  async function handleDeleteFileImage(fileId: string) {
    const ok = confirm("Bild wirklich löschen?");
    if (!ok) return;
    const res = await deleteProjectFileAction(fileId);
    if (res?.error) {
      alert(res.error);
      return;
    }
    setRefreshTick((t) => t + 1);
  }

  const allItems: GalleryItem[] = [
    ...fileImages.map((f) => ({
      id: f.id,
      created_at: f.created_at,
      source: "file" as const,
      label: f.file_name,
    })),
    ...photos.map((p) => ({
      id: p.id,
      created_at: p.created_at,
      source: "legacy" as const,
      label: "Foto",
    })),
  ]
    .filter((p) => !failedPhotoIds.has(`${p.source}:${p.id}`))
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  return (
    <div className="space-y-5">
      <PhotoUploader onUploaded={() => setRefreshTick((t) => t + 1)} />
      <button
        type="button"
        onClick={() => setGalleryExpanded((v) => !v)}
        className={`inline-flex items-center rounded-md px-4 py-2 text-sm font-semibold ${
          galleryExpanded
            ? "bg-primary-700 text-white hover:bg-primary-800"
            : "bg-primary-600 text-white hover:bg-primary-700"
        }`}
      >
        {galleryExpanded ? "Galerie zuklappen" : "Galerie aufklappen"}
      </button>

      <div>
        <h3 className="mb-3 text-sm font-semibold text-gray-900">
          Galerie
        </h3>

        {loading && (
          <div className="text-sm text-gray-500">Fotos werden geladen…</div>
        )}

        {error && (
          <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        {!loading && galleryExpanded && allItems.length === 0 && !error && (
          <div className="text-sm text-gray-500">Noch keine Fotos vorhanden.</div>
        )}

        {galleryExpanded && allItems.length > 0 && (
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
            {allItems.map((p) => (
              <div
                key={`${p.source}:${p.id}`}
                className="relative overflow-hidden rounded-md border border-gray-200 bg-gray-50"
              >
                <img
                  src={p.source === "file" ? `/api/files/${p.id}/image` : `/api/photos/${p.id}/image`}
                  alt="Projektfoto"
                  className="aspect-square w-full object-cover"
                  loading="lazy"
                  onError={async () => {
                    setFailedPhotoIds((prev) => new Set(prev).add(`${p.source}:${p.id}`));
                    // Optionales Aufräumen: DB-Eintrag entfernen, wenn die Datei im Storage fehlt.
                    try {
                      if (p.source === "legacy") {
                        await supabase.from("photos").delete().eq("id", p.id);
                      }
                      setRefreshTick((t) => t + 1);
                    } catch {
                      // no-op: Bild bleibt nur ausgeblendet
                    }
                  }}
                />
                <button
                  type="button"
                  className="absolute right-1 top-1 rounded bg-white/90 px-2 py-1 text-xs font-medium text-red-700 shadow hover:bg-white"
                  onClick={() =>
                    p.source === "legacy"
                      ? handleDeletePhoto(p.id)
                      : handleDeleteFileImage(p.id)
                  }
                >
                  Löschen
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}


"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { PhotoUploader } from "@/components/PhotoUploader";

type PhotoRow = {
  id: string;
  image_url: string;
  created_at: string;
};

export function ProjectPhotosSection() {
  const supabase = useMemo(() => createClient(), []);
  const [photos, setPhotos] = useState<PhotoRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshTick, setRefreshTick] = useState(0);
  const [selectedPhoto, setSelectedPhoto] = useState<PhotoRow | null>(null);
  const [error, setError] = useState<string | null>(null);

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
          .select("id, image_url, created_at")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(50);

        if (photosError) {
          if (!mounted) return;
          setError(photosError.message);
          setPhotos([]);
          return;
        }

        if (!mounted) return;
        setPhotos((data || []) as PhotoRow[]);
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
  }, [supabase, refreshTick]);

  return (
    <div className="space-y-5">
      <PhotoUploader onUploaded={() => setRefreshTick((t) => t + 1)} />

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

        {!loading && photos.length === 0 && !error && (
          <div className="text-sm text-gray-500">Noch keine Fotos vorhanden.</div>
        )}

        {photos.length > 0 && (
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
            {photos.map((p) => (
              <button
                key={p.id}
                type="button"
                className="relative overflow-hidden rounded-md border border-gray-200 bg-gray-50"
                onClick={() => setSelectedPhoto(p)}
                title="Foto öffnen"
              >
                <img
                  src={`/api/photos/${p.id}/image`}
                  alt="Projektfoto"
                  className="aspect-square w-full object-cover"
                  loading="lazy"
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {selectedPhoto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 px-4">
          <div className="w-full max-w-3xl overflow-hidden rounded-lg bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
              <p className="truncate text-sm font-medium text-gray-900">Foto</p>
              <button
                type="button"
                className="rounded-md bg-gray-100 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-200"
                onClick={() => setSelectedPhoto(null)}
              >
                Schließen
              </button>
            </div>
            <div className="p-4">
              <img
                src={`/api/photos/${selectedPhoto.id}/image`}
                alt="Foto groß"
                className="max-h-[70vh] w-full object-contain"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


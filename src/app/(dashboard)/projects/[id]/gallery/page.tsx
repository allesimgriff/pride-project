import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAuthUser } from "@/lib/auth/cachedDashboardSession";
import { deleteLegacyProjectPhotoAction, deleteProjectFileAction } from "@/app/actions/projects";

type ImageFileRow = {
  id: string;
  file_name: string;
  created_at: string;
};

type LegacyPhotoRow = {
  id: string;
  created_at: string;
};

export default async function ProjectGalleryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const user = await getAuthUser();

  const { data: project, error: projectError } = await supabase
    .from("projects")
    .select("id, product_name, project_image_id")
    .eq("id", id)
    .single();

  if (projectError || !project) {
    notFound();
  }

  const { data: imageFiles, error: filesError } = await supabase
    .from("project_files")
    .select("id, file_name, created_at, mime_type")
    .eq("project_id", id)
    .like("mime_type", "image/%")
    .order("created_at", { ascending: false });

  if (filesError) {
    return (
      <div className="card p-6">
        <p className="text-sm text-red-700">{filesError.message}</p>
      </div>
    );
  }

  const files = (imageFiles ?? []) as (ImageFileRow & { mime_type: string | null })[];
  let legacyPhotos: LegacyPhotoRow[] = [];
  if (user) {
    const { data } = await supabase
      .from("photos")
      .select("id, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(200);
    legacyPhotos = (data ?? []) as LegacyPhotoRow[];
  }

  async function handleDeleteProjectFile(formData: FormData) {
    "use server";
    const fileId = String(formData.get("fileId") ?? "");
    if (!fileId) return;
    await deleteProjectFileAction(fileId);
  }

  async function handleDeleteLegacyPhoto(formData: FormData) {
    "use server";
    const photoId = String(formData.get("photoId") ?? "");
    if (!photoId) return;
    await deleteLegacyProjectPhotoAction(id, photoId);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Projekt-Galerie</h1>
          <p className="mt-1 text-sm text-gray-500">{project.product_name}</p>
        </div>
        <Link
          href={`/projects/${id}`}
          className="rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Zurück zum Projekt
        </Link>
      </div>

      {files.length === 0 ? (
        <div className="card p-6 text-sm text-gray-500">
          Noch keine Bilder vorhanden.
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {files.map((file) => {
            const isTitleImage = project.project_image_id === file.id;
            return (
              <div
                key={file.id}
                className="group overflow-hidden rounded-lg border border-gray-200 bg-white"
              >
                <a
                  href={`/api/files/${file.id}/image`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block"
                  title={file.file_name}
                >
                  <img
                    src={`/api/files/${file.id}/image`}
                    alt={file.file_name}
                    className="aspect-square w-full object-cover transition-transform duration-200 group-hover:scale-[1.02]"
                    loading="lazy"
                  />
                </a>
                <div className="space-y-1 px-3 py-2">
                  <p className="truncate text-xs font-medium text-gray-800">{file.file_name}</p>
                  {isTitleImage ? (
                    <p className="text-xs font-medium text-primary-700">Titelbild</p>
                  ) : null}
                  <form action={handleDeleteProjectFile}>
                    <input type="hidden" name="fileId" value={file.id} />
                    <button
                      type="submit"
                      className="mt-1 text-xs font-medium text-red-700 hover:underline"
                    >
                      Bild löschen
                    </button>
                  </form>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {legacyPhotos.length > 0 ? (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-gray-900">
            Weitere hochgeladene Fotos
          </h2>
          <p className="text-sm text-gray-500">
            Diese Bilder stammen aus dem bisherigen Foto-Upload (Altbestand).
          </p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {legacyPhotos.map((photo) => (
              <div
                key={photo.id}
                className="group overflow-hidden rounded-lg border border-gray-200 bg-white"
              >
                <a
                  href={`/api/photos/${photo.id}/image`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block"
                >
                  <img
                    src={`/api/photos/${photo.id}/image`}
                    alt="Projektfoto"
                    className="aspect-square w-full object-cover transition-transform duration-200 group-hover:scale-[1.02]"
                    loading="lazy"
                  />
                </a>
                <div className="px-3 py-2">
                  <form action={handleDeleteLegacyPhoto}>
                    <input type="hidden" name="photoId" value={photo.id} />
                    <button
                      type="submit"
                      className="text-xs font-medium text-red-700 hover:underline"
                    >
                      Bild löschen
                    </button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

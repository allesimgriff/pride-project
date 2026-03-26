"use client";

import type { ProjectLabelMap } from "@/lib/projectLabelDefaults";
import { useApp } from "@/components/providers/AppProvider";
import { ProjectPhotosSection } from "@/components/projects/ProjectPhotosSection";
import { EditableProjectLabel } from "@/components/projects/EditableProjectLabel";

export function ProjectPhotosBlock({
  projectId,
  projectLabels,
  workspaceId,
  canEditLabels,
}: {
  projectId: string;
  projectLabels: ProjectLabelMap;
  workspaceId: string | null;
  canEditLabels: boolean;
}) {
  const { lang } = useApp();
  const labelNrTitle =
    lang === "de"
      ? "Entspricht der Spalte „Nr.“ unter Überschriften für diesen Workspace"
      : "Matches the “Nr.” column under headings for this workspace";

  const fbHeading =
    lang === "de" ? "Fotos zum Projekt" : "Photos for the project";
  const fbIntro =
    lang === "de"
      ? "Hier kannst du direkt vom Handy (Kamera/Galerie) oder vom Rechner Fotos hochladen."
      : "Upload photos from your phone (camera/gallery) or from your computer.";

  return (
    <div className="card p-6">
      <h2 className="mb-3 text-lg font-semibold text-gray-900">
        <EditableProjectLabel
          labelKey="photosHeading"
          fallback={fbHeading}
          workspaceId={workspaceId}
          projectLabels={projectLabels}
          canEdit={canEditLabels}
          showNr
          nrTitle={labelNrTitle}
          textClassName="text-lg font-semibold text-gray-900"
        />
      </h2>
      <p className="mb-3 text-sm text-gray-500">
        <EditableProjectLabel
          labelKey="photosIntro"
          fallback={fbIntro}
          workspaceId={workspaceId}
          projectLabels={projectLabels}
          canEdit={canEditLabels}
          showNr
          nrTitle={labelNrTitle}
          textClassName="text-sm text-gray-500"
        />
      </p>
      <ProjectPhotosSection projectId={projectId} />
    </div>
  );
}

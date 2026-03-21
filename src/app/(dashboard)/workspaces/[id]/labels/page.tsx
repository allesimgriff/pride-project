import { notFound, redirect } from "next/navigation";
import { getWorkspaceDetailAction } from "@/app/actions/workspaces";

/** Alte URL: Überschriften werden inline auf der Projektseite / „Neues Projekt“ bearbeitet. */
export default async function WorkspaceLabelsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const detail = await getWorkspaceDetailAction(id);
  if (detail.error || !detail.workspace) {
    notFound();
  }
  redirect(`/workspaces/${id}`);
}

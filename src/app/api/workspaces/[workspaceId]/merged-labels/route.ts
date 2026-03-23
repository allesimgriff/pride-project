import { NextResponse } from "next/server";
import {
  canEditWorkspaceLabelsForWorkspaceAction,
  listMergedProjectLabelsForWorkspaceAction,
} from "@/app/actions/workspaceProjectLabels";

/** Header: keine Server-Actions im Client-Bundle (vermeidet „Server Action not found“ nach Deploy). */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ workspaceId: string }> },
) {
  const { workspaceId } = await params;
  const [can, labels] = await Promise.all([
    canEditWorkspaceLabelsForWorkspaceAction(workspaceId),
    listMergedProjectLabelsForWorkspaceAction(workspaceId),
  ]);
  return NextResponse.json({
    canEdit: can.canEdit,
    data: labels.data,
    error: labels.error,
  });
}

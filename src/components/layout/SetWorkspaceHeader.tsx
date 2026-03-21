"use client";

import { useEffect } from "react";
import { useHeaderWorkspace } from "@/components/layout/HeaderWorkspaceContext";

/** Setzt den Workspace für die Kopfzeilen-Überschrift (merged Labels). Bei Unmount: zurück zur globalen Standard-Überschrift. */
export function SetWorkspaceHeader({ workspaceId }: { workspaceId: string | null }) {
  const { setWorkspaceId } = useHeaderWorkspace();
  useEffect(() => {
    setWorkspaceId(workspaceId);
    return () => setWorkspaceId(null);
  }, [workspaceId, setWorkspaceId]);
  return null;
}

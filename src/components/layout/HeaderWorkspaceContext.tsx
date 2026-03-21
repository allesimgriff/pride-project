"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

type Ctx = {
  workspaceId: string | null;
  setWorkspaceId: (id: string | null) => void;
};

const HeaderWorkspaceContext = createContext<Ctx | null>(null);

export function HeaderWorkspaceProvider({ children }: { children: ReactNode }) {
  const [workspaceId, setWorkspaceIdState] = useState<string | null>(null);
  const setWorkspaceId = useCallback((id: string | null) => {
    setWorkspaceIdState(id);
  }, []);
  const value = useMemo(() => ({ workspaceId, setWorkspaceId }), [workspaceId, setWorkspaceId]);
  return <HeaderWorkspaceContext.Provider value={value}>{children}</HeaderWorkspaceContext.Provider>;
}

/** Liefert immer einen Kontext; ohne Provider: workspaceId bleibt null, setWorkspaceId ist no-op. */
export function useHeaderWorkspace(): Ctx {
  const ctx = useContext(HeaderWorkspaceContext);
  return (
    ctx ?? {
      workspaceId: null,
      setWorkspaceId: () => {},
    }
  );
}

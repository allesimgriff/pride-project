"use client";

import { useEffect, useState } from "react";

export function GlobalBusyIndicator() {
  const [pendingCount, setPendingCount] = useState(0);
  const [manualBusy, setManualBusy] = useState(false);
  const [navBusy, setNavBusy] = useState(false);
  const [fetchBusyVisible, setFetchBusyVisible] = useState(false);

  useEffect(() => {
    const originalFetch = window.fetch.bind(window);

    function inc() {
      setPendingCount((c) => c + 1);
    }

    function dec() {
      setPendingCount((c) => (c > 0 ? c - 1 : 0));
    }

    window.fetch = async (...args: Parameters<typeof fetch>): Promise<Response> => {
      inc();
      try {
        return await originalFetch(...args);
      } finally {
        dec();
      }
    };

    return () => {
      window.fetch = originalFetch;
    };
  }, []);

  useEffect(() => {
    function onManualBusy(event: Event) {
      const custom = event as CustomEvent<{ active?: boolean }>;
      setManualBusy(Boolean(custom.detail?.active));
    }

    window.addEventListener("app-busy-manual", onManualBusy as EventListener);
    return () => {
      window.removeEventListener("app-busy-manual", onManualBusy as EventListener);
    };
  }, []);

  useEffect(() => {
    function onClick(event: MouseEvent) {
      if (event.defaultPrevented) return;
      if (event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

      const target = event.target as HTMLElement | null;
      const anchor = target?.closest("a") as HTMLAnchorElement | null;
      if (!anchor) return;
      if (anchor.target && anchor.target !== "_self") return;
      if (anchor.hasAttribute("download")) return;
      if (!anchor.href) return;

      const url = new URL(anchor.href, window.location.origin);
      if (url.origin !== window.location.origin) return;
      if (url.pathname === window.location.pathname && url.search === window.location.search) return;
      if (url.pathname.startsWith("/api/")) return;

      setNavBusy(true);
    }

    const originalPushState = history.pushState.bind(history);
    const originalReplaceState = history.replaceState.bind(history);

    function clearNavBusySoon() {
      window.setTimeout(() => {
        setNavBusy(false);
      }, 100);
    }

    history.pushState = (...args) => {
      const result = originalPushState(...args);
      clearNavBusySoon();
      return result;
    };

    history.replaceState = (...args) => {
      const result = originalReplaceState(...args);
      clearNavBusySoon();
      return result;
    };

    window.addEventListener("popstate", clearNavBusySoon);
    document.addEventListener("click", onClick, true);

    return () => {
      history.pushState = originalPushState;
      history.replaceState = originalReplaceState;
      window.removeEventListener("popstate", clearNavBusySoon);
      document.removeEventListener("click", onClick, true);
    };
  }, []);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;
    if (pendingCount > 0) {
      timer = setTimeout(() => setFetchBusyVisible(true), 250);
    } else {
      setFetchBusyVisible(false);
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [pendingCount]);

  useEffect(() => {
    if (fetchBusyVisible || manualBusy || navBusy) {
      document.body.classList.add("app-busy");
    } else {
      document.body.classList.remove("app-busy");
    }
    return () => {
      document.body.classList.remove("app-busy");
    };
  }, [fetchBusyVisible, manualBusy, navBusy]);

  if (!fetchBusyVisible && !manualBusy && !navBusy) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-[9999] flex justify-center p-2">
      <div className="inline-flex items-center gap-2 rounded-full bg-primary-700/95 px-3 py-1.5 text-xs font-semibold text-white shadow-lg">
        <span className="h-3 w-3 animate-spin rounded-full border-2 border-white/35 border-t-white" />
        Prozess läuft...
      </div>
    </div>
  );
}

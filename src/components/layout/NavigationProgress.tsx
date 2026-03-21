"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

const MIN_VISIBLE_MS = 520;

/** Dünne Leiste oben bei Client-Navigation – auf dem Handy sofort sichtbar, dass etwas passiert. */
export function NavigationProgress() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);
  const prevPath = useRef<string | null>(null);

  useEffect(() => {
    if (prevPath.current === null) {
      prevPath.current = pathname;
      return;
    }
    if (prevPath.current === pathname) return;

    prevPath.current = pathname;
    setVisible(true);
    const t = window.setTimeout(() => setVisible(false), MIN_VISIBLE_MS);
    return () => window.clearTimeout(t);
  }, [pathname]);

  return (
    <div
      className={`pointer-events-none fixed left-0 right-0 top-0 z-[100] h-1 overflow-hidden bg-primary-100/40 transition-opacity duration-150 ${
        visible ? "opacity-100" : "opacity-0"
      }`}
      aria-hidden
    >
      <div
        className="h-full w-1/3 bg-gradient-to-r from-primary-500 via-primary-400 to-primary-500 motion-safe:animate-nav-progress motion-reduce:w-full motion-reduce:animate-none"
        style={{ willChange: "transform" }}
      />
    </div>
  );
}

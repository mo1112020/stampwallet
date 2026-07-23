"use client";

import { useEffect } from "react";

/** Registers the Scanner PWA's service worker — see public/sw.js. */
export function RegisterServiceWorker() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // Non-fatal — the app still works without offline shell caching.
      });
    }
  }, []);

  return null;
}

"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// Unlike LobbyPoller, this doesn't skip refreshing while the tab is
// "hidden" — OBS's Browser Source doesn't reliably report as visible the
// way a normal backgrounded browser tab does, and this is a low-traffic
// internal tool, so there's no real cost to just always polling.
export function StreamRefreshPoller({ intervalMs = 15000 }: { intervalMs?: number }) {
  const router = useRouter();

  useEffect(() => {
    const id = setInterval(() => router.refresh(), intervalMs);
    return () => clearInterval(id);
  }, [router, intervalMs]);

  return null;
}

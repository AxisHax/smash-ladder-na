"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

const POLL_INTERVAL_MS = 20000;

// Same "skip while backgrounded" idea as LobbyPoller — this is a public,
// potentially high-traffic page, so idle tabs shouldn't keep re-running the
// feed query (and its Twitch Helix calls) every 20s for nobody.
export function SetsFeedPoller() {
  const router = useRouter();

  useEffect(() => {
    function tick() {
      if (document.visibilityState === "visible") router.refresh();
    }
    const id = setInterval(tick, POLL_INTERVAL_MS);
    document.addEventListener("visibilitychange", tick);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", tick);
    };
  }, [router]);

  return null;
}

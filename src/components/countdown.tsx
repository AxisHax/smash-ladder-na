"use client";

import { useEffect, useState } from "react";

function secondsUntil(deadlineMs: number) {
  return Math.max(0, Math.ceil((deadlineMs - Date.now()) / 1000));
}

// Ticks down once a second on the client so the number doesn't visibly
// freeze between the page's ~5s server polls (LobbyPoller) — those still
// own the actual deadline value and whatever happens once it hits 0
// (forfeit, etc.); this only makes the display itself smooth in between.
// suppressHydrationWarning for the same one-paint SSR/CSR clock mismatch
// reason as LocalTime.
export function Countdown({ deadline }: { deadline: string }) {
  const deadlineMs = new Date(deadline).getTime();
  const [seconds, setSeconds] = useState(() => secondsUntil(deadlineMs));

  // Deliberately not also setting state synchronously here for the
  // deadlineMs-changed case (e.g. the server poll advancing to a new
  // game's deadline) — the interval below catches up within a second
  // regardless, and doing it eagerly here would just cascade an extra
  // render for no visible benefit.
  useEffect(() => {
    const id = setInterval(() => setSeconds(secondsUntil(deadlineMs)), 1000);
    return () => clearInterval(id);
  }, [deadlineMs]);

  return <span suppressHydrationWarning>{seconds}</span>;
}

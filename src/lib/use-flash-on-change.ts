"use client";

import { useEffect, useRef, useState } from "react";
import { playUpdateBlip } from "@/lib/sound";

const FLASH_DURATION_MS = 800;

// True for a brief moment whenever `value` changes (skipping the initial
// mount), plus a short blip — for values that update from outside a direct
// click, like a room code refreshed via polling or an action's result.
export function useFlashOnChange(value: string | null): boolean {
  const [flashing, setFlashing] = useState(false);
  const previousValue = useRef(value);

  useEffect(() => {
    if (previousValue.current === value) return;
    previousValue.current = value;
    setFlashing(true);
    playUpdateBlip();
    const id = setTimeout(() => setFlashing(false), FLASH_DURATION_MS);
    return () => clearTimeout(id);
  }, [value]);

  return flashing;
}

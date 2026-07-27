"use client";

// Server-rendered pages don't know the visitor's timezone, so this renders
// in whatever timezone the runtime defaults to (UTC on the server) for the
// very first paint, then React re-renders it in the browser's actual local
// timezone once mounted. suppressHydrationWarning is the sanctioned way to
// let that one-time mismatch through instead of erroring.
export function LocalTime({ iso }: { iso: string }) {
  return (
    <span suppressHydrationWarning>
      {new Date(iso).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}
    </span>
  );
}

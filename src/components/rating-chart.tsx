"use client";

import { useState } from "react";

type Point = { date: string; rating: number };

// Fixed locale/timeZone so this renders identically during SSR and on the
// client — the browser's default locale/timeZone can differ from the
// server's, which otherwise causes a hydration mismatch here.
function formatDate(date: string) {
  return new Date(date).toLocaleDateString("en-US", { timeZone: "UTC" });
}

const WIDTH = 560;
const HEIGHT = 160;
const PAD_X = 8;
const PAD_TOP = 12;
const PAD_BOTTOM = 24;

export function RatingChart({ points }: { points: Point[] }) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  if (points.length < 2) {
    return <p className="text-sm text-muted-foreground">Not enough confirmed matches yet.</p>;
  }

  const ratings = points.map((p) => p.rating);
  const min = Math.min(...ratings);
  const max = Math.max(...ratings);
  const span = Math.max(max - min, 1);
  const yPad = span * 0.15;
  const yMin = min - yPad;
  const yMax = max + yPad;

  const plotW = WIDTH - PAD_X * 2;
  const plotH = HEIGHT - PAD_TOP - PAD_BOTTOM;

  // Positioned by real elapsed time, not by index — so a burst of same-day
  // matches clusters together instead of spreading evenly across the chart.
  // Points sharing a calendar day are pre-condensed by condenseByDay, so a
  // degenerate all-same-timestamp case can't reach here once length >= 2.
  const times = points.map((p) => new Date(p.date).getTime());
  const minTime = times[0];
  const maxTime = times[times.length - 1];
  const timeSpan = Math.max(maxTime - minTime, 1);

  const x = (i: number) => PAD_X + ((times[i] - minTime) / timeSpan) * plotW;
  const y = (rating: number) => PAD_TOP + (1 - (rating - yMin) / (yMax - yMin)) * plotH;

  const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"}${x(i)},${y(p.rating)}`).join(" ");

  const gridLines = [yMin + (yMax - yMin) * 0.25, yMin + (yMax - yMin) * 0.5, yMin + (yMax - yMin) * 0.75];

  // Static date labels along the bottom so the timeline reads at a glance —
  // hovering (below) still gives the exact date+rating for any point, but
  // that's undiscoverable on touch devices, which don't really have a hover
  // state. First, last, and (once there's a real middle) one in between.
  const labelIndices = [...new Set([0, Math.floor((points.length - 1) / 2), points.length - 1])];

  const hovered = hoverIndex !== null ? points[hoverIndex] : null;

  function handleMove(e: React.MouseEvent<SVGSVGElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const relX = ((e.clientX - rect.left) / rect.width) * WIDTH;
    // Points aren't evenly spaced (x reflects real elapsed time), so find
    // the nearest one by position rather than inferring an index by ratio.
    let nearest = 0;
    let nearestDist = Infinity;
    for (let i = 0; i < points.length; i++) {
      const dist = Math.abs(x(i) - relX);
      if (dist < nearestDist) {
        nearestDist = dist;
        nearest = i;
      }
    }
    setHoverIndex(nearest);
  }

  return (
    <div>
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="w-full touch-none"
        onMouseMove={handleMove}
        onMouseLeave={() => setHoverIndex(null)}
        role="img"
        aria-label="Rating over recent matches"
      >
        {gridLines.map((gy) => (
          <line
            key={gy}
            x1={PAD_X}
            x2={WIDTH - PAD_X}
            y1={y(gy)}
            y2={y(gy)}
            className="stroke-border"
            strokeWidth={1}
          />
        ))}

        <path
          d={linePath}
          fill="none"
          stroke="oklch(0.6 0.19 255)"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="dark:[stroke:oklch(0.65_0.17_255)]"
        />

        {hovered && hoverIndex !== null && (
          <g>
            <line
              x1={x(hoverIndex)}
              x2={x(hoverIndex)}
              y1={PAD_TOP}
              y2={HEIGHT - PAD_BOTTOM}
              className="stroke-muted-foreground/40"
              strokeWidth={1}
            />
            <circle
              cx={x(hoverIndex)}
              cy={y(hovered.rating)}
              r={4}
              fill="oklch(0.6 0.19 255)"
              className="dark:[fill:oklch(0.72_0.16_255)]"
              stroke="var(--background)"
              strokeWidth={2}
            />
          </g>
        )}

        {labelIndices.map((i, idx) => (
          <text
            key={i}
            x={x(i)}
            y={HEIGHT - 6}
            textAnchor={idx === 0 ? "start" : idx === labelIndices.length - 1 ? "end" : "middle"}
            className="fill-muted-foreground"
            style={{ fontSize: 9 }}
          >
            {formatDate(points[i].date)}
          </text>
        ))}
      </svg>

      <div className="flex h-5 items-center justify-center text-xs text-muted-foreground">
        {hovered
          ? `${formatDate(hovered.date)} — ${hovered.rating} rating`
          : `${points[0].rating} → ${points[points.length - 1].rating} over last ${points.length} matches`}
      </div>

      <details className="mt-2 text-xs">
        <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
          View as table
        </summary>
        <div className="mt-2 max-h-40 overflow-y-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-muted-foreground">
                <th className="py-1 font-medium">Date</th>
                <th className="py-1 text-right font-medium tabular-nums">Rating</th>
              </tr>
            </thead>
            <tbody>
              {[...points].reverse().map((p) => (
                <tr key={p.date} className="border-t border-border/60">
                  <td className="py-1">{formatDate(p.date)}</td>
                  <td className="py-1 text-right tabular-nums">{p.rating}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  );
}

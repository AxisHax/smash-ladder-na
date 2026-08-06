// Season prize pool, split across the top 5 finishers on the leaderboard at
// season end. Weighted toward 1st to keep the top-of-board race meaningful
// rather than flattening into "just finish top 5."
export const SEASON_PRIZE_POOL_USD = 700;

export const PRIZE_SPLIT_PERCENT = [40, 25, 15, 11, 9] as const;

// 1-indexed place. Returns null outside the paid places.
export function prizeForPlace(place: number): number | null {
  const percent = PRIZE_SPLIT_PERCENT[place - 1];
  if (percent === undefined) return null;
  return Math.round((SEASON_PRIZE_POOL_USD * percent) / 100);
}

// Reference rate only (~17.25 MXN/USD as of 2026-08-06) — payouts are always
// made in USD via PayPal regardless of the winner's country, so this exists
// purely to give Spanish-reading players a rough sense of the amount, shown
// alongside (never instead of) the real USD figure. A few pesos of drift
// from the live rate is fine for a "roughly this much" label; update
// periodically rather than wiring up a live-rate API for it.
const USD_TO_MXN_REFERENCE_RATE = 17.25;

export function approxMxn(usd: number): number {
  return Math.round(usd * USD_TO_MXN_REFERENCE_RATE);
}

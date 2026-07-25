// Season prize pool, split across the top 5 finishers on the leaderboard at
// season end. Weighted toward 1st to keep the top-of-board race meaningful
// rather than flattening into "just finish top 5."
export const SEASON_PRIZE_POOL_USD = 1000;

export const PRIZE_SPLIT_PERCENT = [40, 25, 15, 11, 9] as const;

// 1-indexed place. Returns null outside the paid places.
export function prizeForPlace(place: number): number | null {
  const percent = PRIZE_SPLIT_PERCENT[place - 1];
  if (percent === undefined) return null;
  return Math.round((SEASON_PRIZE_POOL_USD * percent) / 100);
}

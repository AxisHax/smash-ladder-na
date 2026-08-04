export type RankTier = {
  name: string;
  minRating: number;
  className: string;
};

// Self-declared rating-gap radius, like MATCH_DISTANCE_PRESETS for region.
// null means any rating. Matching requires BOTH sides' gap setting to cover
// the actual |ratingA - ratingB| difference — same reasoning as distance:
// a player's tolerance for a lopsided match is theirs to set, not something
// the other side's wider setting should override.
export const MATCH_RATING_GAP_PRESETS = [
  { label: "Within 25", gap: 25 },
  { label: "Within 50", gap: 50 },
  { label: "Within 75", gap: 75 },
  { label: "Within 100", gap: 100 },
  { label: "Within 150", gap: 150 },
  { label: "Within 200", gap: 200 },
  { label: "Within 300", gap: 300 },
  { label: "Within 500", gap: 500 },
  { label: "Any rating", gap: null },
] as const;

// Ordered highest to lowest; the first tier whose floor the rating clears
// wins. Centered on the 1500 starting rating so a fresh, actively-playing
// account lands around Challenger rather than at the bottom of the ladder.
const TIERS: RankTier[] = [
  {
    name: "Legend",
    minRating: 2100,
    className: "bg-rose-100 text-rose-800 dark:bg-rose-500/15 dark:text-rose-400",
  },
  {
    name: "Grandmaster",
    minRating: 1900,
    className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-500/15 dark:text-yellow-400",
  },
  {
    name: "Master",
    minRating: 1750,
    className: "bg-violet-100 text-violet-800 dark:bg-violet-500/15 dark:text-violet-400",
  },
  {
    name: "Elite",
    minRating: 1600,
    className: "bg-blue-100 text-blue-800 dark:bg-blue-500/15 dark:text-blue-400",
  },
  {
    name: "Fighter",
    minRating: 1450,
    className: "bg-sky-100 text-sky-800 dark:bg-sky-500/15 dark:text-sky-400",
  },
  {
    name: "Challenger",
    minRating: -Infinity,
    className: "bg-orange-100 text-orange-800 dark:bg-orange-500/15 dark:text-orange-400",
  },
];

// Rating is noisy under this many games (the K-factor tapering matches this
// same threshold elsewhere), so a provisional player gets no tier yet rather
// than a misleadingly precise one. Also used by lobby.ts to cap how wide a
// rating gap a provisional player can be matched across.
export const PROVISIONAL_GAMES_THRESHOLD = 10;

export function getRankTier(rating: number, gamesPlayed: number): RankTier | null {
  if (gamesPlayed < PROVISIONAL_GAMES_THRESHOLD) return null;
  return TIERS.find((t) => rating >= t.minRating) ?? TIERS[TIERS.length - 1];
}

// Separate from the tier/K-factor threshold above: public leaderboards
// (site-wide, per-character, season standings) just need enough games to
// rule out a one-win fluke, not full rating convergence — a lower bar so
// genuinely strong players show up as visible proof of the ladder's
// competition instead of sitting hidden for their first 10 games.
export const LEADERBOARD_MIN_GAMES = 3;

// True only when a match's rating gain crossed into a strictly higher tier
// — used to surface a special "tier up" moment rather than the regular win
// celebration. Same gamesPlayed used for both sides on purpose: what
// matters here is which side of a rating threshold the match landed on,
// not reconstructing a historical games-played count.
export function didTierUp(ratingBefore: number, ratingAfter: number, gamesPlayed: number) {
  const before = getRankTier(ratingBefore, gamesPlayed);
  const after = getRankTier(ratingAfter, gamesPlayed);
  if (!before || !after) return false;
  return TIERS.indexOf(after) < TIERS.indexOf(before);
}

function minRatingFor(tierName: string) {
  return TIERS.find((t) => t.name === tierName)!.minRating;
}

export type Achievement = { id: string; label: string; description: string; achieved: boolean };

// Derived on the fly from stats that already persist forever (match/rating
// history, tournament entries) rather than a stored Achievement table — no
// schema needed, and nothing to backfill for existing players.
export function computeAchievements(stats: {
  totalWins: number;
  peakRating: number | null;
  seasonsPlayed: number;
  tournamentsEntered: number;
}): Achievement[] {
  const peak = stats.peakRating ?? -Infinity;
  return [
    { id: "first-win", label: "First Win", description: "Win your first ranked set.", achieved: stats.totalWins >= 1 },
    { id: "ten-wins", label: "10 Wins", description: "Win 10 ranked sets.", achieved: stats.totalWins >= 10 },
    { id: "fifty-wins", label: "50 Wins", description: "Win 50 ranked sets.", achieved: stats.totalWins >= 50 },
    {
      id: "elite",
      label: "Reached Elite",
      description: `Reach a rating of ${minRatingFor("Elite")}.`,
      achieved: peak >= minRatingFor("Elite"),
    },
    {
      id: "master",
      label: "Reached Master",
      description: `Reach a rating of ${minRatingFor("Master")}.`,
      achieved: peak >= minRatingFor("Master"),
    },
    {
      id: "grandmaster",
      label: "Reached Grandmaster",
      description: `Reach a rating of ${minRatingFor("Grandmaster")}.`,
      achieved: peak >= minRatingFor("Grandmaster"),
    },
    {
      id: "legend",
      label: "Reached Legend",
      description: `Reach a rating of ${minRatingFor("Legend")}.`,
      achieved: peak >= minRatingFor("Legend"),
    },
    {
      id: "veteran",
      label: "Played 3+ Seasons",
      description: "Play in 3 or more ladder seasons.",
      achieved: stats.seasonsPlayed >= 3,
    },
    {
      id: "competitor",
      label: "Entered a Tournament",
      description: "Sign up for a tournament through the site.",
      achieved: stats.tournamentsEntered >= 1,
    },
  ];
}

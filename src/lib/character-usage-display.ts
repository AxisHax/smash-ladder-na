import type { CharacterUsage } from "./players";

const SECONDARY_ICON_COUNT = 3;

export interface CharacterUsageDisplay {
  main: CharacterUsage | null;
  secondary: CharacterUsage[];
  overflow: CharacterUsage[];
}

// Slices a player's ranked character usage into what CharacterUsageIcons
// renders inline (main + up to 3 next-most-played) versus what folds into
// the overflow tooltip, so a player who's played many characters doesn't
// turn every row that shows them into a wall of tiny icons.
export function groupCharacterUsageForDisplay(usage: CharacterUsage[]): CharacterUsageDisplay {
  return {
    main: usage[0] ?? null,
    secondary: usage.slice(1, 1 + SECONDARY_ICON_COUNT),
    overflow: usage.slice(1 + SECONDARY_ICON_COUNT),
  };
}

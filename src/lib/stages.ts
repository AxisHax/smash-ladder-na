// Game 1's starter stagelist. A random player strikes 1, the opponent
// strikes 2, then the first striker picks the stage from what's left.
export const GAME_ONE_STAGES = [
  "Battlefield",
  "Small Battlefield",
  "Pokémon Stadium 2",
  "Smashville",
  "Town and City",
] as const;

// Games 2+ add three counterpick stages. The previous game's winner strikes
// 3, and the loser picks the stage from what's left.
export const COUNTERPICK_STAGES = [
  ...GAME_ONE_STAGES,
  "Final Destination",
  "Hollow Bastion",
  "Kalos Pokémon League",
] as const;

// Maps stage names to their image paths under /stages/.
const STAGE_IMAGE_MAP: Record<string, string> = {
  Battlefield: "battlefield.png",
  "Small Battlefield": "small_battlefield.png",
  "Pokémon Stadium 2": "pokemon_stadium.png",
  Smashville: "smashville.png",
  "Town and City": "town_and_city.png",
  "Final Destination": "final_destination.png",
  "Hollow Bastion": "hollow_bastion.png",
  "Kalos Pokémon League": "kalos.png",
};

export function stageImagePath(stage: string): string {
  return STAGE_IMAGE_MAP[stage] ?? null;
}

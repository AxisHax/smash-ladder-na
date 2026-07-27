"use client";

import { useActionState } from "react";
import { CharacterSelect } from "@/components/character-select";
import { Button } from "@/components/ui/button";

type OwnCharactersState = { error: string | null };

const SECONDARY_SLOTS = 5;

export function OwnCharactersForm({
  action,
  defaultMainCharacter,
  defaultSecondaryCharacters,
  selfDeclared,
}: {
  action: (prevState: OwnCharactersState, formData: FormData) => Promise<OwnCharactersState>;
  defaultMainCharacter: string;
  defaultSecondaryCharacters: string[];
  selfDeclared: boolean;
}) {
  const [state, formAction, isPending] = useActionState(action, { error: null });
  // Pads to a fixed number of slots so empty ones render as "None" selects.
  const slots = [...defaultSecondaryCharacters, ...Array(SECONDARY_SLOTS).fill("")].slice(0, SECONDARY_SLOTS);

  return (
    <div className="flex flex-col gap-2">
      <div>
        <p className="text-sm font-medium">Your characters</p>
        <p className="text-xs text-muted-foreground">
          {selfDeclared
            ? "Set by you — opponents reporting what they saw you play no longer changes this."
            : "Currently set by whoever you've played against reporting what they saw — set it yourself to lock it in."}
        </p>
      </div>
      <form action={formAction} className="flex flex-col gap-2">
        <label className="flex flex-col gap-1 text-sm">
          Main
          <CharacterSelect
            key={defaultMainCharacter}
            name="mainCharacter"
            defaultValue={defaultMainCharacter}
            placeholder="Not set"
          />
        </label>
        <div className="flex flex-col gap-1 text-sm">
          Secondaries
          <div className="flex flex-wrap gap-2">
            {slots.map((value, i) => (
              <CharacterSelect
                key={i + value}
                name="secondaryCharacters"
                defaultValue={value}
                placeholder="None"
              />
            ))}
          </div>
        </div>
        <Button type="submit" size="sm" disabled={isPending} className="self-start">
          Save
        </Button>
      </form>
      {state.error && <p className="text-xs text-destructive">{state.error}</p>}
    </div>
  );
}

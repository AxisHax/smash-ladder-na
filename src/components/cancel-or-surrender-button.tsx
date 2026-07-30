"use client";

import { useRef } from "react";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { useConfirm } from "@/components/confirm-dialog";

type ActionState = { error: string | null };

// Same button, two very different consequences depending on whether the
// opponent has engaged yet (see hasOpponentEngaged in lib/matches.ts) — the
// label, confirm copy, and button color all change so it's never ambiguous
// which one you're about to click. "cancel" is free (the opponent hasn't
// shown up); "surrender" counts as an actual loss.
export function CancelOrSurrenderButton({
  mode,
  action,
}: {
  mode: "cancel" | "surrender";
  action: (prevState: ActionState, formData: FormData) => Promise<ActionState>;
}) {
  const [state, formAction, isPending] = useActionState(action, { error: null });
  const [confirm, confirmDialog] = useConfirm();
  const confirmReadyRef = useRef(false);

  const confirmMessage =
    mode === "surrender"
      ? "Surrender this match? Your opponent has already started, so this counts as a loss and will affect your rating. This can't be undone."
      : "Cancel this match? This can't be undone.";

  return (
    <div className="flex flex-col items-end gap-1">
      <form
        action={formAction}
        onSubmit={(e) => {
          if (confirmReadyRef.current) {
            confirmReadyRef.current = false;
            return;
          }
          e.preventDefault();
          confirm(confirmMessage, { cancelLabel: "Go back" }).then((ok) => {
            if (ok) {
              confirmReadyRef.current = true;
              e.currentTarget.requestSubmit();
            }
          });
        }}
      >
        <Button type="submit" variant="destructive" size="sm" disabled={isPending}>
          {mode === "surrender" ? "Surrender (counts as a loss)" : "Cancel match"}
        </Button>
      </form>
      {state.error && <p className="text-xs text-destructive">{state.error}</p>}
      {confirmDialog}
    </div>
  );
}

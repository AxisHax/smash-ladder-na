"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";

type CancelMatchState = { error: string | null };

export function CancelMatchButton({
  action,
}: {
  action: (prevState: CancelMatchState, formData: FormData) => Promise<CancelMatchState>;
}) {
  const [state, formAction, isPending] = useActionState(action, { error: null });

  return (
    <div className="flex flex-col items-end gap-1">
      <form
        action={formAction}
        onSubmit={(e) => {
          if (!confirm("Cancel this match? This can't be undone.")) {
            e.preventDefault();
          }
        }}
      >
        <Button type="submit" variant="destructive" size="sm" disabled={isPending}>
          Cancel match
        </Button>
      </form>
      {state.error && <p className="text-xs text-destructive">{state.error}</p>}
    </div>
  );
}

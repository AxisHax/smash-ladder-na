"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";

type DisputeResolutionState = { error: string | null; message: string | null };

export function DisputeResolutionForm({
  action,
  myId,
  opponentId,
  opponentUsername,
}: {
  action: (prevState: DisputeResolutionState, formData: FormData) => Promise<DisputeResolutionState>;
  myId: string;
  opponentId: string;
  opponentUsername: string;
}) {
  const [state, formAction, isPending] = useActionState(action, { error: null, message: null });

  return (
    <div className="mt-2 flex flex-col gap-1.5 text-xs">
      <p className="text-muted-foreground">
        Agree with {opponentUsername} on who actually won this game and it resolves immediately —
        no need to wait on a mod.
      </p>
      <form action={formAction} className="flex gap-2">
        <Button type="submit" name="winnerId" value={myId} size="sm" variant="outline" disabled={isPending}>
          I won
        </Button>
        <Button type="submit" name="winnerId" value={opponentId} size="sm" variant="outline" disabled={isPending}>
          {opponentUsername} won
        </Button>
      </form>
      {state.error && <p className="text-destructive">{state.error}</p>}
      {state.message && <p className="text-muted-foreground">{state.message}</p>}
    </div>
  );
}

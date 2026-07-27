"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";

type CorrectionState = { error: string | null; message: string | null };

export function RequestCorrectionForm({
  action,
  myId,
  opponentId,
  opponentUsername,
}: {
  action: (prevState: CorrectionState, formData: FormData) => Promise<CorrectionState>;
  myId: string;
  opponentId: string;
  opponentUsername: string;
}) {
  const [state, formAction, isPending] = useActionState(action, { error: null, message: null });

  return (
    <details className="mt-1 text-xs">
      <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
        Wrong result?
      </summary>
      <div className="mt-2 flex flex-col gap-1.5">
        <p className="text-muted-foreground">
          Only works while this is still both of your most recent confirmed match. If your pick
          doesn&apos;t match {opponentUsername}&apos;s, a mod reviews it instead.
        </p>
        <form action={formAction} className="flex gap-2">
          <Button type="submit" name="winnerId" value={myId} size="sm" variant="outline" disabled={isPending}>
            I actually won
          </Button>
          <Button type="submit" name="winnerId" value={opponentId} size="sm" variant="outline" disabled={isPending}>
            {opponentUsername} actually won
          </Button>
        </form>
        {state.error && <p className="text-destructive">{state.error}</p>}
        {state.message && <p className="text-muted-foreground">{state.message}</p>}
      </div>
    </details>
  );
}

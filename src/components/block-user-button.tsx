"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";

type BlockState = { error: string | null };

export function BlockUserButton({
  action,
  username,
}: {
  action: (prevState: BlockState, formData: FormData) => Promise<BlockState>;
  username: string;
}) {
  const [state, formAction, isPending] = useActionState(action, { error: null });

  return (
    <div className="flex flex-col items-end gap-1">
      <form
        action={formAction}
        onSubmit={(e) => {
          if (
            !confirm(
              `Block ${username}? This is permanent and can't be undone — you'll never be matched with them again in ranked queueing.`,
            )
          ) {
            e.preventDefault();
          }
        }}
      >
        <Button type="submit" variant="outline" size="sm" disabled={isPending}>
          Block
        </Button>
      </form>
      {state.error && <p className="text-xs text-destructive">{state.error}</p>}
    </div>
  );
}

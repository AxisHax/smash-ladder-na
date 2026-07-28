"use client";

import { useRef } from "react";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { useConfirm } from "@/components/confirm-dialog";

type BlockState = { error: string | null };

export function BlockUserButton({
  action,
  username,
}: {
  action: (prevState: BlockState, formData: FormData) => Promise<BlockState>;
  username: string;
}) {
  const [state, formAction, isPending] = useActionState(action, { error: null });
  const [confirm, confirmDialog] = useConfirm();
  const confirmReadyRef = useRef(false);

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
          confirm(
            `Block ${username}? This is permanent and can't be undone — you'll never be matched with them again in ranked queueing.`,
          ).then((ok) => {
            if (ok) {
              confirmReadyRef.current = true;
              e.currentTarget.requestSubmit();
            }
          });
        }}
      >
        <Button type="submit" variant="outline" size="sm" disabled={isPending}>
          Block
        </Button>
      </form>
      {state.error && <p className="text-xs text-destructive">{state.error}</p>}
      {confirmDialog}
    </div>
  );
}

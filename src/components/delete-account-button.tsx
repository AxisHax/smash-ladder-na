"use client";

import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { useConfirm } from "@/components/confirm-dialog";

export function DeleteAccountButton({ action }: { action: () => Promise<void> }) {
  const [confirm, confirmDialog] = useConfirm();
  const confirmReadyRef = useRef(false);

  return (
    <>
      <form
        action={action}
        onSubmit={(e) => {
          if (confirmReadyRef.current) {
            confirmReadyRef.current = false;
            return;
          }
          e.preventDefault();
          confirm(
            "Delete your account? Your username, avatar, and email are removed permanently. Match history stays (anonymized) so other players' records stay intact. This can't be undone.",
          ).then((ok) => {
            if (ok) {
              confirmReadyRef.current = true;
              e.currentTarget.requestSubmit();
            }
          });
        }}
      >
        <Button type="submit" variant="destructive" size="sm">
          Delete my account
        </Button>
      </form>
      {confirmDialog}
    </>
  );
}

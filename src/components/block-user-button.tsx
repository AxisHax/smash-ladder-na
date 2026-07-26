"use client";

import { Button } from "@/components/ui/button";

export function BlockUserButton({
  action,
  username,
}: {
  action: () => Promise<void>;
  username: string;
}) {
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (
          !confirm(
            `Block ${username}? You'll never be matched with them again in ranked queueing. You can unblock them later from Settings.`,
          )
        ) {
          e.preventDefault();
        }
      }}
    >
      <Button type="submit" variant="outline" size="sm">
        Block
      </Button>
    </form>
  );
}

export function UnblockUserButton({ action }: { action: () => Promise<void> }) {
  return (
    <form action={action}>
      <Button type="submit" variant="outline" size="sm">
        Unblock
      </Button>
    </form>
  );
}

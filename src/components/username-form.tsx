"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import type { UpdateUsernameState } from "@/app/settings/actions";

export function UsernameForm({
  defaultValue,
  action,
}: {
  defaultValue: string;
  action: (prevState: UpdateUsernameState, formData: FormData) => Promise<UpdateUsernameState>;
}) {
  const [state, formAction, isPending] = useActionState(action, { error: null, message: null });

  return (
    <form action={formAction} className="flex items-end gap-2">
      <label className="flex flex-1 flex-col gap-1 text-sm">
        Username
        <span className="text-xs font-normal text-muted-foreground">
          Shown everywhere on the site instead of your Discord name — handy if they don&apos;t
          match.
        </span>
        <input
          name="username"
          type="text"
          required
          maxLength={32}
          defaultValue={defaultValue}
          className="h-8 rounded-lg border border-border bg-background px-2.5 text-sm text-foreground outline-none focus-visible:border-ring"
        />
        {state.error && <span className="text-destructive">{state.error}</span>}
        {state.message && <span className="text-muted-foreground">{state.message}</span>}
      </label>
      <Button type="submit" size="sm" disabled={isPending}>
        Save
      </Button>
    </form>
  );
}

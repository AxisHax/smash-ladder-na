"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";

type ReportConductState = { error: string | null; message: string | null };

export function ReportConductForm({
  action,
}: {
  action: (prevState: ReportConductState, formData: FormData) => Promise<ReportConductState>;
}) {
  const [state, formAction, isPending] = useActionState(action, { error: null, message: null });

  return (
    <details className="text-xs">
      <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
        Report a problem
      </summary>
      <div className="mt-2 flex flex-col gap-1.5">
        <form action={formAction} className="flex items-end gap-2">
          <textarea
            name="reason"
            required
            rows={2}
            placeholder="What happened?"
            maxLength={1000}
            className="w-full resize-none rounded-lg border border-border bg-transparent px-2.5 py-1.5 text-sm outline-none focus-visible:border-ring"
          />
          <Button type="submit" size="sm" variant="outline" disabled={isPending}>
            Submit
          </Button>
        </form>
        {state.error && <p className="text-destructive">{state.error}</p>}
        {state.message && <p className="text-muted-foreground">{state.message}</p>}
      </div>
    </details>
  );
}

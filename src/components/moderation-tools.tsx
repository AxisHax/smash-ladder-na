"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";

type ModerationState = { error: string | null };

const SUSPENSION_DURATION_OPTIONS = [
  { label: "1 hour", value: "1" },
  { label: "24 hours", value: "24" },
  { label: "3 days", value: "72" },
  { label: "7 days", value: "168" },
  { label: "30 days", value: "720" },
  { label: "Indefinite", value: "indefinite" },
] as const;

export function ModerationStatusForm({
  action,
  currentStatus,
}: {
  action: (prevState: ModerationState, formData: FormData) => Promise<ModerationState>;
  currentStatus: "ACTIVE" | "SUSPENDED" | "BANNED";
}) {
  const [state, formAction, isPending] = useActionState(action, { error: null });

  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm font-medium">Moderator tools</p>
      <p className="text-xs text-muted-foreground">
        Direct action — no report or threshold required. Current status:{" "}
        <span className="font-medium">{currentStatus.toLowerCase()}</span>.
      </p>
      <form action={formAction} className="flex flex-wrap items-center gap-1.5">
        <select
          name="suspensionHours"
          defaultValue="indefinite"
          className="h-7 rounded-lg border border-border bg-background px-1.5 text-xs text-foreground outline-none focus-visible:border-ring"
        >
          {SUSPENSION_DURATION_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <input
          name="reason"
          placeholder="Reason (optional)"
          maxLength={1000}
          className="h-7 w-40 rounded-lg border border-border bg-transparent px-2 text-xs outline-none focus-visible:border-ring"
        />
        <Button type="submit" name="action" value="SUSPEND" size="sm" variant="secondary" disabled={isPending}>
          Suspend
        </Button>
        <Button type="submit" name="action" value="BAN" size="sm" variant="destructive" disabled={isPending}>
          Insta-ban
        </Button>
        {currentStatus !== "ACTIVE" && (
          <Button type="submit" name="action" value="REINSTATE" size="sm" variant="outline" disabled={isPending}>
            Reinstate
          </Button>
        )}
      </form>
      {state.error && <p className="text-xs text-destructive">{state.error}</p>}
    </div>
  );
}

type AdminOverrideState = { error: string | null };

type AdminOverrideAction = (prevState: AdminOverrideState, formData: FormData) => Promise<AdminOverrideState>;

export function AdminMatchOverride({
  player1Username,
  player2Username,
  actionForPlayer1,
  actionForPlayer2,
}: {
  player1Username: string;
  player2Username: string;
  // Must already be bound server actions (e.g. `serverAction.bind(null, ...)`)
  // — a plain closure built in the parent Server Component isn't a Server
  // Action itself and can't be passed as a prop to this Client Component.
  actionForPlayer1: AdminOverrideAction;
  actionForPlayer2: AdminOverrideAction;
}) {
  const [state1, formAction1, isPending1] = useActionState(actionForPlayer1, { error: null });
  const [state2, formAction2, isPending2] = useActionState(actionForPlayer2, { error: null });
  const error = state1.error ?? state2.error;

  return (
    <details className="mt-1 text-xs">
      <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
        Mod: change winner
      </summary>
      <div className="mt-2 flex flex-col gap-1.5">
        <div className="flex gap-2">
          <form action={formAction1}>
            <Button type="submit" size="sm" variant="outline" disabled={isPending1 || isPending2}>
              {player1Username} won
            </Button>
          </form>
          <form action={formAction2}>
            <Button type="submit" size="sm" variant="outline" disabled={isPending1 || isPending2}>
              {player2Username} won
            </Button>
          </form>
        </div>
        {error && <p className="text-destructive">{error}</p>}
      </div>
    </details>
  );
}

"use client";

import { useActionState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { JoinLobbyState } from "@/app/lobby/actions";

export function JoinLobbyForm({
  action,
  className,
  lang = "en",
}: {
  action: (prevState: JoinLobbyState, formData: FormData) => Promise<JoinLobbyState>;
  className?: string;
  lang?: "en" | "es";
}) {
  const [state, formAction, isPending] = useActionState(action, { error: null });

  return (
    <form action={formAction} className={className}>
      <label className="flex items-start gap-1.5 text-sm text-muted-foreground">
        <input type="checkbox" name="isPracticing" className="mt-0.5 size-3.5" />
        <span>
          {lang === "es" ? "Practicando esta sesión" : "Practicing this session"}
          <span className="block text-xs">
            {lang === "es"
              ? "Los resultados cuentan para una clasificación de práctica aparte — tu clasificación normal del ladder y tus partidas jugadas no se mueven en absoluto."
              : "Results count toward a separate practice rating — your regular ladder rating and sets played don't move at all."}
          </span>
        </span>
      </label>
      <Button type="submit" disabled={isPending} className="mt-2">
        {isPending ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            {lang === "es" ? "Buscando rival…" : "Searching for an opponent…"}
          </>
        ) : lang === "es" ? (
          "Buscar nuevo rival"
        ) : (
          "Search for New Opponent"
        )}
      </Button>
      {state.error && <p className="mt-2 text-sm text-destructive">{state.error}</p>}
    </form>
  );
}

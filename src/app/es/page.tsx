import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { Activity, Swords, Trophy, Users } from "lucide-react";
import { redirect } from "next/navigation";
import { auth, signIn, primaryProviderId } from "@/auth";
import { getPublicStats } from "@/lib/public-stats";
import { setPreferredLanguage } from "@/lib/account";
import { Button } from "@/components/ui/button";
import { Badge, badgeVariants } from "@/components/ui/badge";
import { DiscordIcon } from "@/components/discord-icon";
import { RankBadge } from "@/components/rank-badge";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { prisma } from "@/lib/db";
import { DISCORD_SERVER_URL } from "@/lib/links";

export const metadata: Metadata = {
  title: "Smash Ladder NA — Liga clasificatoria",
  description: "Liga clasificatoria y emparejamiento de Norteamérica para Smash, en español.",
  alternates: { languages: { "en-US": "/" } },
};

// Spanish landing page only — deliberately not a full i18n setup. Everything
// past sign-in (lobby, settings, admin, etc.) stays English-only; this page
// exists to answer "what is this, should I sign up" for Spanish-speaking
// players before they hit that English wall, not to translate the whole app.
export default async function HomeEs() {
  const session = await auth();
  const user = session?.user;

  const [me, stats] = await Promise.all([
    user?.id
      ? prisma.user.findUnique({
          where: { id: user.id },
          select: { rating: true, gamesPlayed: true },
        })
      : null,
    getPublicStats(),
  ]);

  async function switchToEnglish() {
    "use server";
    // Re-checks the session itself rather than closing over `user` from the
    // outer scope — see the matching comment in app/page.tsx's
    // switchToSpanish for why.
    const actionSession = await auth();
    if (actionSession?.user?.id) await setPreferredLanguage(actionSession.user.id, null);
    redirect("/");
  }

  return (
    <main className="mx-auto max-w-2xl px-6 py-20">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className="border-primary/30 text-primary">
            Norteamérica
          </Badge>
          <a
            href={DISCORD_SERVER_URL}
            target="_blank"
            rel="noreferrer"
            className={cn(
              badgeVariants({ variant: "outline" }),
              "border-transparent bg-[#5865F2] text-white transition-colors hover:bg-[#4752C4]",
            )}
          >
            <DiscordIcon className="size-3.5" />
            Discord
          </a>
        </div>
        <form action={switchToEnglish}>
          <button
            type="submit"
            className="cursor-pointer text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
          >
            English
          </button>
        </form>
      </div>
      <h1 className="text-4xl font-semibold tracking-tight text-balance">Smash Ladder NA</h1>
      <p className="mt-3 max-w-md text-muted-foreground">
        Una liga clasificatoria y emparejamiento para la comunidad de Smash de Norteamérica.
      </p>
      <p className="mt-1 max-w-md text-xs text-muted-foreground">
        El resto del sitio (sala de juego, ajustes, etc.) está solo en inglés por ahora.
      </p>

      {!user && (
        <form
          action={async () => {
            "use server";
            await signIn(primaryProviderId);
          }}
          className="mt-8"
        >
          <Button type="submit" size="lg">
            Inicia sesión para empezar
          </Button>
        </form>
      )}

      {user && me && (
        <p className="mt-6 text-sm text-muted-foreground tabular-nums">
          Tienes una clasificación de <span className="font-medium text-foreground">{me.rating}</span> en{" "}
          {me.gamesPlayed} sets.
        </p>
      )}

      <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
        {stats.playingNow > 0 && (
          <span className="flex items-center gap-1.5 tabular-nums">
            <span className="relative flex size-2">
              <span className="live-pulse absolute inline-flex size-full rounded-full bg-emerald-500 opacity-75" />
              <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
            </span>
            <span className="font-medium text-foreground">{stats.playingNow}</span> jugando ahora
          </span>
        )}
        <span className="flex items-center gap-1.5 tabular-nums">
          <Users className="size-3.5 text-primary" />
          <span className="font-medium text-foreground">{stats.totalPlayers}</span> jugadores
        </span>
        <span className="flex items-center gap-1.5 tabular-nums">
          <Activity className="size-3.5 text-primary" />
          <span className="font-medium text-foreground">{stats.matchesToday}</span> partidas hoy
        </span>
      </div>

      {stats.topPlayers.length > 0 && (
        <div className="mt-10">
          <h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Los mejores de la liga
          </h2>
          <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
            {stats.topPlayers.map((p, i) => (
              <Link key={p.id} href={`/players/${p.id}`}>
                <Card className="h-full py-0 transition-colors hover:border-foreground/30">
                  <CardContent className="flex items-center gap-3 py-3">
                    <span className="shrink-0 text-lg tabular-nums text-muted-foreground">
                      {["🥇", "🥈", "🥉"][i]}
                    </span>
                    {p.avatarUrl && (
                      <Image
                        src={p.avatarUrl}
                        alt={p.username}
                        width={32}
                        height={32}
                        className="shrink-0 rounded-full"
                      />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{p.username}</p>
                      <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5">
                        <p className="text-xs tabular-nums text-muted-foreground">{p.rating} de clasificación</p>
                        <RankBadge rating={p.rating} gamesPlayed={p.gamesPlayed} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="mt-12 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Link href="/lobby">
          <Card className="h-full transition-colors hover:border-foreground/30">
            <CardHeader>
              <Swords className="size-5 text-muted-foreground" />
              <CardTitle className="text-base">Sala clasificatoria</CardTitle>
              <CardDescription>
                Ponte en cola y te emparejamos automáticamente para una partida clasificatoria.
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>
        <Link href="/leaderboard">
          <Card className="h-full transition-colors hover:border-foreground/30">
            <CardHeader>
              <Trophy className="size-5 text-muted-foreground" />
              <CardTitle className="text-base">Tabla de clasificación</CardTitle>
              <CardDescription>Mira en qué posición estás.</CardDescription>
            </CardHeader>
          </Card>
        </Link>
        <a
          href={DISCORD_SERVER_URL}
          target="_blank"
          rel="noreferrer"
          className="h-full"
        >
          <Card className="h-full transition-colors hover:border-foreground/30">
            <CardHeader>
              <DiscordIcon className="size-5 text-muted-foreground" />
              <CardTitle className="text-base">Discord</CardTitle>
              <CardDescription>Únete al servidor de la comunidad para socializar y obtener ayuda.</CardDescription>
            </CardHeader>
          </Card>
        </a>
      </div>
    </main>
  );
}

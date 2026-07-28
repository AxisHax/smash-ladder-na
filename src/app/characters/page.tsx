import Link from "next/link";
import { Swords } from "lucide-react";
import { prisma } from "@/lib/db";
import { SMASH_CHARACTERS, echoGroupCanonical, echoGroupLabel, echoGroupMembers } from "@/lib/characters";
import { CharacterIcon } from "@/components/character-icon";
import { AdSlot } from "@/components/ad-slot";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

export default async function CharactersPage() {
  const counts = await prisma.user.groupBy({
    by: ["mainCharacter"],
    where: { mainCharacter: { not: null }, gamesPlayed: { gte: 10 } },
    _count: { mainCharacter: true },
  });
  const countByCharacter = new Map(counts.map((c) => [c.mainCharacter, c._count.mainCharacter]));

  // One row per echo group (Marth absorbs Lucina, etc.) rather than one per
  // roster entry — echoes are functionally the same fighter, so splitting
  // their usage counts across separate rows just undercounts both. Filters
  // to only each group's canonical member so an echo doesn't also get its
  // own separate row.
  const canonicalCharacters = SMASH_CHARACTERS.filter((c) => echoGroupCanonical(c) === c);

  return (
    <main className="mx-auto max-w-2xl px-6 py-16">
      <div className="flex items-center gap-2">
        <Swords className="size-5 text-muted-foreground" />
        <h1 className="text-2xl font-semibold tracking-tight">Characters</h1>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">
        Mains are set by whoever you played against, not by yourself — ask an opponent to report
        it after a match. Most echo fighters (Dark Pit, Daisy, Dark Samus, Richter) are counted
        together with their base fighter — Marth/Lucina, Roy/Chrom, and Ryu/Ken are kept separate.
        Browse a character&apos;s leaderboard below.
      </p>

      <Card className="mt-8 divide-y divide-border overflow-hidden py-0">
        {canonicalCharacters.map((c) => {
          const groupCount = echoGroupMembers(c).reduce(
            (sum, member) => sum + (countByCharacter.get(member) ?? 0),
            0,
          );
          return (
            <Link
              key={c}
              href={`/leaderboard?character=${encodeURIComponent(c)}`}
              className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-accent"
            >
              <CharacterIcon name={c} />
              <span className="flex-1">{echoGroupLabel(c)}</span>
              {groupCount > 0 && (
                <Badge variant="outline" className="tabular-nums">
                  {groupCount}
                </Badge>
              )}
            </Link>
          );
        })}
      </Card>

      <AdSlot slot={process.env.NEXT_PUBLIC_ADSENSE_SLOT_CHARACTERS} />
    </main>
  );
}

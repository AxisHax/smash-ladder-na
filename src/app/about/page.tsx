import { DISCORD_SERVER_URL } from "@/lib/links";

export const metadata = { title: "About — Smash Ladder NA" };

export default function AboutPage() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-16">
      <h1 className="text-2xl font-semibold tracking-tight">About</h1>
      <p className="mt-1 text-sm text-muted-foreground">Who&apos;s behind Smash Ladder NA and what it&apos;s for.</p>

      <div className="mt-8 flex flex-col gap-6 text-sm text-muted-foreground">
        <section>
          <h2 className="text-sm font-medium text-foreground">What this is</h2>
          <p className="mt-2">
            Smash Ladder NA is a ranked ladder and matchmaking site for the North American Super
            Smash Bros. Ultimate community. Sign in with Discord, set a region and match
            preferences, and get paired against opponents around your skill level — no bracket, no
            sign-up window, just queue up and play. Preseason launched July 2026, with a full
            first season to follow.
          </p>
        </section>

        <section>
          <h2 className="text-sm font-medium text-foreground">Why it exists</h2>
          <p className="mt-2">
            Competitive Smash has plenty of tournament infrastructure (start.gg and friends) but
            not much for the day-to-day: finding a real ranked opponent outside of an event. This
            fills that gap — an Elo-style rating, seasonal leaderboards, and a Free Battle board
            for casual games, all built around the North American scene specifically.
          </p>
        </section>

        <section>
          <h2 className="text-sm font-medium text-foreground">Who runs it</h2>
          <p className="mt-2">
            An independent, fan-run project — not affiliated with Nintendo, start.gg, or any
            existing ladder/matchmaking platform. Moderation is handled by a small volunteer team
            of mods and admins drawn from the community itself; see the{" "}
            <a href="/faq" className="underline">
              Q&amp;A page
            </a>{" "}
            for how that&apos;s staffed.
          </p>
        </section>

        <section>
          <h2 className="text-sm font-medium text-foreground">How can I contribute?</h2>
          <p className="mt-2">
            The codebase is public on{" "}
            <a
              href="https://github.com/abcmouce-jpg/smash-ladder-na"
              className="underline"
              target="_blank"
              rel="noreferrer"
            >
              GitHub
            </a>
            . Bug reports and feature ideas are welcome as issues, and pull requests get reviewed —
            several of the site&apos;s features shipped from community PRs. Not a coder? The{" "}
            <a href={DISCORD_SERVER_URL} className="underline" target="_blank" rel="noreferrer">
              Discord server
            </a>{" "}
            is just as useful: reporting bugs, suggesting changes, or helping out as a mod all count.
          </p>
        </section>

        <section>
          <h2 className="text-sm font-medium text-foreground">Get in touch</h2>
          <p className="mt-2">
            The{" "}
            <a href={DISCORD_SERVER_URL} className="underline" target="_blank" rel="noreferrer">
              community Discord server
            </a>{" "}
            is where the team actually hangs out — bug reports, feature ideas, ban appeals, and
            general questions all go through there. See the{" "}
            <a href="/rules" className="underline">
              Rules
            </a>{" "}
            and{" "}
            <a href="/faq" className="underline">
              Q&amp;A
            </a>{" "}
            pages for anything about how the ladder itself works.
          </p>
        </section>
      </div>
    </main>
  );
}

import Link from "next/link";
import { Coffee } from "lucide-react";
import { DISCORD_SERVER_URL, KOFI_URL } from "@/lib/links";

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-border">
      <div className="mx-auto flex max-w-2xl flex-col gap-3 px-6 py-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:py-4">
        <p>Smash Ladder NA — an independent, fan-run community project. Not affiliated with Nintendo.</p>
        <nav className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <Link href="/about" prefetch={false} className="hover:text-foreground hover:underline">
            About
          </Link>
          <Link href="/rules" prefetch={false} className="hover:text-foreground hover:underline">
            Rules
          </Link>
          <Link href="/faq" prefetch={false} className="hover:text-foreground hover:underline">
            Q&amp;A
          </Link>
          <Link href="/privacy" prefetch={false} className="hover:text-foreground hover:underline">
            Privacy
          </Link>
          <Link href="/terms" prefetch={false} className="hover:text-foreground hover:underline">
            Terms
          </Link>
          <a
            href={DISCORD_SERVER_URL}
            target="_blank"
            rel="noreferrer"
            className="hover:text-foreground hover:underline"
          >
            Discord
          </a>
          <a
            href={KOFI_URL}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1 hover:text-foreground hover:underline"
          >
            <Coffee className="size-3.5" />
            Support us
          </a>
        </nav>
      </div>
    </footer>
  );
}

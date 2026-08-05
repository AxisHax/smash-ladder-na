import { Info } from "lucide-react";
import { RankTierList } from "@/components/rank-tier-list";
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

// The tier-info dialog, opened from the "How do tiers work?" link on the
// leaderboard page. Holds no open/close state of its own — Radix's Dialog
// tracks that internally — so this stays a Server Component and ships no
// client JS beyond the primitive itself.
//
// The trigger renders as a <button>, not an <a>, so cursor-pointer is needed:
// Tailwind's preflight already makes it inherit the surrounding text's size
// and color, but the browser still gives a bare <button> an arrow cursor
// where an <a href> gets a pointer, which is the one visible difference.
export function InfoPopup() {
  return (
    <Dialog>
      <DialogTrigger className="text-sm text-muted-foreground hover:underline cursor-pointer">
        How do tiers work?
      </DialogTrigger>
      <DialogContent>
        <div className="flex items-center gap-2">
          <Info className="size-5 text-muted-foreground" />
          <DialogTitle>How Tiers Work</DialogTitle>
        </div>
        <DialogDescription className="mt-3">
          Every rank a player can hold, highest first. Your rank comes from your ladder rating,
          which starts at 1500 and moves after every confirmed ranked set.
        </DialogDescription>

        <RankTierList className="mt-8" />
      </DialogContent>
    </Dialog>
  );
}

import { getRankTier } from "@/lib/rank-tier";
import { Badge } from "@/components/ui/badge";

export function RankBadge({ rating, gamesPlayed, className }: { rating: number; gamesPlayed: number; className?: string }) {
  const tier = getRankTier(rating, gamesPlayed);

  if (!tier) {
    return <Badge variant="outline" className={className}>Provisional</Badge>;
  }

  return (
    <Badge variant="outline" className={[tier.className, className].filter(Boolean).join(" ")}>
      {tier.name}
    </Badge>
  );
}

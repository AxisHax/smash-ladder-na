import { Radio } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

// Twitch's embed player requires a `parent` query param matching the exact
// hostname it's served from (production, a preview deployment, or
// localhost all differ) — passed in from the page via headers() since
// there's no single fixed site-URL env var in this project.
export function TwitchLiveEmbed({ username, parentHost }: { username: string; parentHost: string }) {
  const src = `https://player.twitch.tv/?channel=${encodeURIComponent(username)}&parent=${encodeURIComponent(parentHost)}&muted=true`;

  return (
    <Card className="mt-4">
      <CardContent className="pt-4">
        <div className="mb-2 flex items-center gap-1.5 text-sm font-medium">
          <Radio className="size-4 text-red-500" />
          Live on Twitch
        </div>
        <div className="aspect-video w-full overflow-hidden rounded-lg">
          <iframe
            src={src}
            allowFullScreen
            className="h-full w-full"
            title={`${username}'s Twitch stream`}
          />
        </div>
      </CardContent>
    </Card>
  );
}

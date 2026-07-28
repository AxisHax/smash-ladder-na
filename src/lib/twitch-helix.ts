const TOKEN_URL = "https://id.twitch.tv/oauth2/token";
const STREAMS_URL = "https://api.twitch.tv/helix/streams";

// App access token (client-credentials grant) — no user involved, distinct
// from the OAuth user-token flow in twitch-oauth.ts. Only used to call
// Helix's /streams "is this channel live" check.
let cachedToken: { token: string; expiresAt: number } | null = null;

async function getAppAccessToken(clientId: string, clientSecret: string): Promise<string | null> {
  if (cachedToken && cachedToken.expiresAt > Date.now()) return cachedToken.token;

  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: clientId,
      client_secret: clientSecret,
    }),
  });
  if (!res.ok) return null;

  const json = (await res.json()) as { access_token?: string; expires_in?: number };
  if (!json.access_token) return null;

  // Cached in-process — a fast path only when the same Fluid Compute
  // instance handles the next call; a cold instance just fetches a fresh
  // one, same as every other request here failing closed on error.
  cachedToken = {
    token: json.access_token,
    expiresAt: Date.now() + (json.expires_in ?? 3600) * 1000 - 60_000,
  };
  return cachedToken.token;
}

// Fails closed (false) on missing config or any API error — a stream embed
// silently not showing up is far better than erroring out a profile page.
export async function isTwitchLive(username: string): Promise<boolean> {
  const clientId = process.env.TWITCH_OAUTH_CLIENT_ID;
  const clientSecret = process.env.TWITCH_OAUTH_CLIENT_SECRET;
  if (!clientId || !clientSecret) return false;

  try {
    const token = await getAppAccessToken(clientId, clientSecret);
    if (!token) return false;

    const res = await fetch(`${STREAMS_URL}?user_login=${encodeURIComponent(username)}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Client-Id": clientId,
      },
      cache: "no-store",
    });
    if (!res.ok) return false;

    const json = (await res.json()) as { data?: unknown[] };
    return (json.data?.length ?? 0) > 0;
  } catch {
    return false;
  }
}

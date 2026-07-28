import { headers } from "next/headers";
import NextAuth from "next-auth";
import type { DefaultSession } from "next-auth";
import Discord from "next-auth/providers/discord";
import type { DiscordProfile } from "next-auth/providers/discord";
import Credentials from "next-auth/providers/credentials";
// eslint-disable-next-line @typescript-eslint/no-unused-vars -- required for the module augmentation below to resolve
import type { JWT } from "next-auth/jwt";
import { prisma } from "@/lib/db";
import { UserStatus } from "@/generated/prisma/enums";
import type { UserRole } from "@/generated/prisma/enums";
import { extractClientIp, isIpBanned } from "@/lib/ip-bans";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: UserRole;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    userId?: string;
    role?: UserRole;
  }
}

const devCredentials = Credentials({
  credentials: { username: { label: "Username" } },
  async authorize(credentials) {
    const username = (credentials.username as string)?.trim() || "Dev Player";
    const discordId = `dev-${username.toLowerCase().replace(/\s+/g, "-")}`;
    const user = await prisma.user.upsert({
      where: { discordId },
      update: {},
      create: { discordId, username },
    });
    return { id: user.id, name: user.username };
  },
});

const useDevCredentials = process.env.NODE_ENV === "development" && !process.env.AUTH_DISCORD_ID;
const providers = useDevCredentials ? [devCredentials] : [Discord];

// Only one provider is ever registered above, but `signIn()` with no provider
// id renders Auth.js's generic (unstyled) provider-picker page instead of
// going straight to it — callers should pass this explicitly.
export const primaryProviderId = useDevCredentials ? "credentials" : "discord";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers,
  session: { strategy: "jwt" },
  trustHost: true,
  callbacks: {
    async signIn({ profile, credentials }) {
      // Checked before anything else, including the dev-credentials bypass —
      // this targets the network (ban-evasion via a fresh Discord account
      // from the same connection), not a specific account.
      const ip = extractClientIp((await headers()).get("x-forwarded-for"));
      if (await isIpBanned(ip)) return false;

      if (credentials) return true; // dev credentials — user already created in authorize()

      const discordProfile = profile as DiscordProfile | undefined;
      if (!discordProfile?.id) return false;

      const existing = await prisma.user.findUnique({
        where: { discordId: discordProfile.id },
        select: { status: true },
      });
      if (existing?.status === UserStatus.BANNED) return false;

      await prisma.user.upsert({
        where: { discordId: discordProfile.id },
        // username is intentionally excluded here — players can rename
        // themselves on the site (their Discord name often doesn't match
        // their player tag), and re-syncing from Discord on every sign-in
        // would silently wipe that out.
        update: {
          avatarUrl: discordProfile.image_url,
          lastKnownIp: ip ?? undefined,
        },
        create: {
          discordId: discordProfile.id,
          username: discordProfile.global_name ?? discordProfile.username,
          avatarUrl: discordProfile.image_url,
          email: discordProfile.email ?? undefined,
          lastKnownIp: ip ?? undefined,
        },
      });

      return true;
    },
    async jwt({ token, user, profile }) {
      if (user?.id) {
        const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
        if (dbUser) {
          token.userId = dbUser.id;
          token.role = dbUser.role;
          return token;
        }
      }
      const discordProfile = profile as DiscordProfile | undefined;
      if (discordProfile?.id) {
        const dbUser = await prisma.user.findUnique({
          where: { discordId: discordProfile.id },
        });
        if (dbUser) {
          token.userId = dbUser.id;
          token.role = dbUser.role;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (token.userId) {
        session.user.id = token.userId;
        // Re-read fresh from the DB on every session check rather than
        // trusting the JWT's role claim, which is only ever populated at
        // sign-in time (the `profile` param the jwt callback keys off is
        // absent on subsequent calls). Otherwise, revoking a MOD/ADMIN's
        // role wouldn't take effect until they happened to sign out —
        // their existing session would silently keep admin access. Same
        // reasoning for username: session.user.name otherwise stays
        // whatever it was at sign-in forever, so renaming yourself on the
        // site wouldn't be reflected anywhere reading the session (e.g. the
        // header) until a fresh sign-in.
        const dbUser = await prisma.user.findUnique({
          where: { id: token.userId },
          select: { role: true, username: true },
        });
        session.user.role = dbUser?.role ?? "USER";
        if (dbUser?.username) session.user.name = dbUser.username;
      }
      return session;
    },
  },
});

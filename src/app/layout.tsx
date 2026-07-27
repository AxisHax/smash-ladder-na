import type { Metadata } from "next";
import { headers } from "next/headers";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import { Analytics } from "@vercel/analytics/next";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { RegionSetupBanner } from "@/components/region-setup-banner";
import { PreSeasonBanner } from "@/components/pre-season-banner";
import { ADSENSE_CLIENT_ID } from "@/components/ad-slot";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Smash Ladder NA",
  description: "North American ranked ladder and matchmaking for Smash.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // /stream/* pages are captured directly by OBS as a broadcast overlay —
  // none of the normal site chrome (nav, banners, ads, footer) belongs in
  // that frame, and a transparent background lets them composite over
  // whatever's underneath instead of blocking it with a solid box.
  const pathname = (await headers()).get("x-pathname") ?? "";
  const isStreamOverlay = pathname.startsWith("/stream");

  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body
        className={`min-h-full flex flex-col text-foreground ${isStreamOverlay ? "bg-transparent" : "bg-background"}`}
      >
        {/* Plain script tag, not next/script — layout.tsx is a Server
            Component, so this only ever exists in the static SSR'd HTML and
            runs before hydration. next/script's beforeInteractive strategy
            re-renders this same element as part of a Client Component on
            the client, which trips React 19's "script tag rendered on the
            client" warning without actually changing what ships. */}
        <script
          id="theme-init"
          suppressHydrationWarning
          dangerouslySetInnerHTML={{
            __html: `try{if(matchMedia('(prefers-color-scheme: dark)').matches)document.documentElement.classList.add('dark')}catch(e){}`,
          }}
        />
        {!isStreamOverlay && ADSENSE_CLIENT_ID && (
          <Script
            async
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT_ID}`}
            crossOrigin="anonymous"
            strategy="afterInteractive"
          />
        )}
        {!isStreamOverlay && <SiteHeader />}
        {!isStreamOverlay && <PreSeasonBanner />}
        {!isStreamOverlay && <RegionSetupBanner />}
        {children}
        {!isStreamOverlay && <SiteFooter />}
        {!isStreamOverlay && <Analytics />}
      </body>
    </html>
  );
}

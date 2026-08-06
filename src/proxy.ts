import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Forwards the request path to Server Components as a header — layout.tsx
// reads it to decide whether to render the normal site chrome (header,
// footer, banners, ads) or the bare shell used by /stream/* broadcast
// overlay pages, which get captured directly by OBS and can't have any of
// that in frame.
export function proxy(request: NextRequest) {
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-pathname", request.nextUrl.pathname);
  const response = NextResponse.next({ request: { headers: requestHeaders } });

  // /es is kept as its own crawlable URL for SEO (a first-touch landing page
  // Google/social links can point Spanish speakers straight at), but every
  // other page's language comes from the "lang" cookie (see lib/i18n.ts).
  // Setting it here means a visitor who lands on /es and then clicks any nav
  // link stays in Spanish instead of snapping back to English on the very
  // next page — a Server Component can't set cookies during render, so this
  // is the one place that can do it without turning /es into a route handler.
  if (request.nextUrl.pathname === "/es") {
    response.cookies.set("lang", "es", { maxAge: 60 * 60 * 24 * 365, path: "/", sameSite: "lax" });
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|apple-icon.png|icon.png).*)"],
};

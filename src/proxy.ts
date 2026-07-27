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
  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|apple-icon.png|icon.png).*)"],
};

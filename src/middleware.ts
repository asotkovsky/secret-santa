import { getSessionCookie } from "better-auth/cookies";
import { NextResponse, type NextRequest } from "next/server";
import { guestCookieOptions, VIEWER_COOKIE, withViewerToken } from "@/lib/guest-cookies";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // A personal page: remember this link in the browser, so if its owner later opens their own
  // guest link, purchases stay hidden from them (see src/lib/guest-cookies.ts). The token isn't
  // checked here; an unknown one simply never matches anyone.
  const personal = /^\/p\/([^/]+)$/.exec(pathname);
  if (personal) {
    const response = NextResponse.next();
    const value = withViewerToken(request.cookies.get(VIEWER_COOKIE)?.value, personal[1]);
    if (value) response.cookies.set(VIEWER_COOKIE, value, guestCookieOptions);
    return response;
  }

  // Organizer pages: optimistic redirect to sign in; real authorization happens in requireExchange.
  if (!getSessionCookie(request)) {
    const url = new URL("/sign-in", request.url);
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/exchanges/:path*", "/p/:token"],
};

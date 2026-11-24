// Cookies for guest links (/g/<shareToken>). Both are httpOnly and only sent to /g/ pages.
//
// VIEWER_COOKIE remembers which personal links (/p/<token>) this browser has opened. People share
// their own guest link, so they can open it themselves; this lets the guest page recognize the
// list's owner and hide purchases from them. Set in middleware.ts.
//
// GUEST_COOKIE is an anonymous guest's random id, made the first time they mark something bought,
// so they (and only they) can undo it.

const TOKEN_RE = /^[A-Za-z0-9_-]{20,64}$/;
const MAX_TOKENS = 10;

export const VIEWER_COOKIE = "nl_viewer";
export const GUEST_COOKIE = "nl_guest";

export const guestCookieOptions = {
  path: "/g",
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  maxAge: 60 * 60 * 24 * 365,
};

export function isGuestToken(value: string | undefined): value is string {
  return !!value && TOKEN_RE.test(value);
}

export function readViewerTokens(value: string | undefined) {
  return (value ?? "").split(".").filter((t) => TOKEN_RE.test(t));
}

/** The cookie value with `token` added (most recent first), or null if nothing changes. */
export function withViewerToken(value: string | undefined, token: string) {
  if (!TOKEN_RE.test(token)) return null;
  const tokens = readViewerTokens(value);
  if (tokens[0] === token) return null;
  return [token, ...tokens.filter((t) => t !== token)].slice(0, MAX_TOKENS).join(".");
}

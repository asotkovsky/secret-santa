import "server-only";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { db } from "@/db";
import { account, session, user, verification } from "@/db/schema";

// On Vercel, also trust the deployment's own URLs so sign-in works on preview deployments.
// BETTER_AUTH_URL (the canonical production URL) is read by Better Auth automatically.
const vercelOrigins = [process.env.VERCEL_URL, process.env.VERCEL_BRANCH_URL, process.env.VERCEL_PROJECT_PRODUCTION_URL]
  .filter(Boolean)
  .map((host) => `https://${host}`);

// In development, also trust the dev server however it's reached: 127.0.0.1, another port, or
// this computer's network address (e.g. testing from a phone on the same Wi-Fi).
const LOCAL_ORIGIN_RE = /^http:\/\/(localhost|127\.0\.0\.1|192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+)(:\d+)?$/;

// Only organizers have accounts. Participants use their personal links.
export const auth = betterAuth({
  trustedOrigins: async (request) => {
    const origin = request?.headers.get("origin");
    const local = process.env.NODE_ENV === "development" && origin && LOCAL_ORIGIN_RE.test(origin);
    return local ? [...vercelOrigins, origin] : vercelOrigins;
  },
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: { user, session, account, verification },
  }),
  emailAndPassword: { enabled: true, minPasswordLength: 8 },
  // Must be last: lets server actions set auth cookies.
  plugins: [nextCookies()],
});

# The Nice List

A family Secret Santa app: draw names, share wish lists, and keep the surprise.

- **Organizers** sign in with email and password. They set up an exchange (spending limit, dates), add people
  with their mobile numbers, choose pairs who can't draw each other, draw names, and text everyone their
  personal link.
- **Participants** don't have accounts. Their personal link (`/p/<token>`) is their login. They reveal who
  they're buying for, keep a wish list (name, photo, links, notes), and browse everyone else's lists.
- **Purchases are secret from the recipient.** Marking an item bought greys it out for other shoppers (the
  buyer can undo). The list's owner never receives purchase information, not even in the page data (see
  `src/server/wishlists.ts`).
- **Texts go from the organizer's own phone.** The app prepares each personalized message, and tapping it opens
  the phone's Messages app with the number and text filled in (an `sms:` link). Nothing is sent by a texting
  service, so there's no carrier registration or cost.

## Running locally

```sh
cp .env.example .env.local      # then fill in BETTER_AUTH_SECRET
docker compose up -d            # Postgres on port 5433
npm install
npm run db:migrate
npm run dev
```

`npm test` runs the draw-algorithm tests. `npm run typecheck` and `npm run lint` check the code.

## Production (AWS RDS)

Set `DATABASE_URL` to the RDS instance, `DATABASE_SSL=verify` (the RDS root certificates are bundled in
`src/db/rds-ca.ts`), and `BETTER_AUTH_URL` to the app's public URL, which also builds the texted links. On
Vercel, `vercel-build` applies migrations on production deployments before building.

After changing `src/db/schema`, run `npm run db:generate` to create a migration in `drizzle/`.

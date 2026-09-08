# Built at Albert

Internal platform for Albert School. A student posts an idea for a tool, the
others vote, someone claims it, builds it elsewhere, and publishes a project
card pointing at the live tool.

The platform hosts no student project. It stores a card and a link.

## Stack

| Piece | Choice |
| --- | --- |
| App | Next.js 16 (App Router, TypeScript) |
| Runtime | Cloudflare Workers via `@opennextjs/cloudflare` |
| Data, auth, files | Supabase (Postgres, Auth, Storage, RLS) |
| Transactional email | Resend |
| Styling | Tailwind CSS v4, no component library |

Two rules the runtime depends on. `nodejs_compat` must stay in
`wrangler.jsonc`, or the Supabase client fails at runtime with an opaque error.
No page or route handler may declare `export const runtime`; the adapter picks
the runtime itself and rejects the override.

## Local setup

```bash
npm install
cp .dev.vars.example .dev.vars   # then fill in the secrets
npm run dev
```

`.dev.vars` holds the server-only secrets and is git-ignored. The Supabase
project URL and publishable key are public by design and live in
`src/lib/public-config.ts` and `wrangler.jsonc`.

To exercise the real Workers runtime rather than `next dev`:

```bash
npm run preview
```

## Database

Migrations are versioned in `supabase/migrations/` and applied in order. They
are the only way the schema changes; nothing is edited by hand in the Supabase
dashboard.

The project's direct Postgres host is IPv6-only and the pooler URI needs a
password that is shown once at project creation, so the runner goes through the
Supabase Management API instead, the same way the dashboard SQL editor does.
Create a token at https://supabase.com/dashboard/account/tokens.

```bash
SUPABASE_ACCESS_TOKEN=sbp_... npm run db:push          # migrations
SUPABASE_ACCESS_TOKEN=sbp_... node scripts/db-push-api.mjs --seed   # + launch content
```

What they set up:

- `0001_schema.sql` — profiles, ideas, votes, claims, projects. A partial unique
  index gives one active claim per idea; a trigger caps a student at two.
- `0002_functions.sql` — every state transition, as definer functions that
  re-check the caller. The two cron functions mutate and return in one
  statement, which is what makes a repeated run harmless.
- `0003_rls.sql` — row level security on every table, plus column grants that
  hide `profiles.email` and make `role` unwritable from a client session.
- `0004_storage.sql` — the `screenshots` bucket, writable only inside a folder
  named after the uploader's id.
- `0005_email_allowlist.sql` — the trigger on `auth.users` that refuses an
  address outside the school domain.
- `0006_function_privileges.sql` — revokes EXECUTE from PUBLIC and hands each
  function back deliberately. Revoking from `anon` and `authenticated` alone
  does nothing, because Postgres grants new functions to PUBLIC.

## Checking the rules hold

```bash
SUPABASE_SERVICE_ROLE_KEY=... npm run verify:rules
```

It attacks the REST and auth APIs directly with the public anon key rather than
going through the application, and covers all of it: the domain allowlist, the
unverified account seeing nothing, moderation before publication, two
simultaneous claims on one idea, the third claim refused, self-voting, role
escalation, reading someone else's email, running the cron functions as a
student, and the cron being safe to run twice.

## Deployment

```bash
npm run deploy
npx wrangler deploy --config worker-cron/wrangler.jsonc
```

Secrets are set with `wrangler secret put`, never committed:

```bash
npx wrangler secret put SUPABASE_SERVICE_ROLE_KEY
npx wrangler secret put RESEND_API_KEY
npx wrangler secret put RESEND_FROM
npx wrangler secret put CRON_SECRET
npx wrangler secret put CRON_SECRET --config worker-cron/wrangler.jsonc
```

`CRON_SECRET` must match on both Workers. See `worker-cron/README.md` for the
schedule and how to trigger a run by hand.

### Supabase settings that are not in migrations

- Auth > SMTP: point it at Resend, sender on the project domain, reply-to the
  administrator. The built-in sender is rate-limited and meant for development.
- Auth > URL configuration: site URL plus `/auth/callback` as a redirect.
- Auth > Email templates: `{{ .TokenHash }}` links are handled by the callback
  route alongside the default `code` links, so either template style works.

## The rule that keeps this alive

A claim lasts 21 days. Reminders go out when 7 and 2 days remain, each with a
one-click extension of 14 days. Past the deadline the claim expires, the idea
returns to `open`, and both the builder and the idea's author are told.

Without that cycle the board fills with frozen ideas and ships nothing. The
exclusivity is a database constraint, never a client-side check.

## Not in v1

Skill profiles, teammate matching, comments, realtime notifications, a
leadership dashboard, leaderboards and badges, project hosting, a native app.

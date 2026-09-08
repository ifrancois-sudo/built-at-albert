# Built at Albert

Internal platform for Albert School. A student posts an idea for a tool, the
others vote, someone claims it, builds it elsewhere, and publishes a project
card pointing at the live tool.

The platform hosts no student project. It stores a card and a link.

Live at **https://built-at-albert.pages.dev**

## Stack

| Piece | Choice |
| --- | --- |
| App | Next.js 16, static export (`output: "export"`) |
| Hosting | Cloudflare Pages |
| Server work | Cloudflare Pages Functions in `functions/api/*` |
| Scheduled work | A separate Worker in `worker-cron/` |
| Data, auth, files | Supabase (Postgres, Auth, Storage, RLS) |
| Transactional email | Resend |
| Styling | Tailwind CSS v4, no component library |

The browser talks to Supabase directly with the publishable key. That key is
public by design, so **row level security is the security boundary**, not the
interface. Every rule is enforced in Postgres and verified against the API
directly; see "Checking the rules hold" below.

Only three things need a secret, and all three live in Pages Functions: sending
email, reading anyone's address, and running the scheduled jobs.

## Local setup

```bash
npm install
npm run dev
```

To run the Functions too, which needs `.dev.vars` filled in from
`.dev.vars.example`:

```bash
npm run dev:functions
```

## Database

Migrations are versioned in `supabase/migrations/` and applied in order. They
are the only way the schema changes; nothing is edited by hand in the dashboard.

The project's direct Postgres host is IPv6-only and the pooler URI needs a
password shown once at project creation, so the runner goes through the Supabase
Management API, the same way the dashboard SQL editor does. Create a token at
https://supabase.com/dashboard/account/tokens.

```bash
SUPABASE_ACCESS_TOKEN=sbp_... npm run db:push
SUPABASE_ACCESS_TOKEN=sbp_... node scripts/db-push-api.mjs --seed
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

The seed needs the admin account to exist first; it authors the launch ideas.

## Checking the rules hold

```bash
SUPABASE_SERVICE_ROLE_KEY=... npm run verify:rules
```

It attacks the REST and auth APIs directly with the public key rather than going
through the interface, and covers the domain allowlist, an unverified account
seeing nothing, moderation before publication, two simultaneous claims on one
idea, the third claim refused, self-voting, role escalation, reading someone
else's email, running the cron functions as a student, and the cron being safe
to run twice.

## Deployment

```bash
npm run deploy        # build + Cloudflare Pages
npm run deploy:cron   # the scheduled Worker
```

Secrets are set with wrangler, never committed:

```bash
npx wrangler pages secret put SUPABASE_URL --project-name built-at-albert
npx wrangler pages secret put SUPABASE_SERVICE_ROLE_KEY --project-name built-at-albert
npx wrangler pages secret put SITE_URL --project-name built-at-albert
npx wrangler pages secret put CRON_SECRET --project-name built-at-albert
npx wrangler pages secret put RESEND_API_KEY --project-name built-at-albert
npx wrangler pages secret put RESEND_FROM --project-name built-at-albert

npx wrangler secret put CRON_SECRET --config worker-cron/wrangler.jsonc
```

`CRON_SECRET` must match on the Pages project and the cron Worker.

### Supabase settings that are not in migrations

- Auth > SMTP: point it at Resend, sender on a domain you control, reply-to the
  administrator. The built-in sender only reaches project team members, so
  without this no student can confirm their address.
- Auth > URL configuration: site URL plus `/auth/callback/` as a redirect.
- Auth > Email templates: `{{ .TokenHash }}` links are handled by the callback
  page alongside the default `code` links, so either template style works.

## The rule that keeps this alive

A claim lasts 21 days. Reminders go out when 7 and 2 days remain, each with a
one-click extension of 14 days. Past the deadline the claim expires, the idea
returns to `open`, and both the builder and the idea's author are told.

Without that cycle the board fills with frozen ideas and ships nothing. The
exclusivity is a database constraint, never a client-side check.

## Not in v1

Skill profiles, teammate matching, comments, realtime notifications, a
leadership dashboard, leaderboards and badges, project hosting, a native app.

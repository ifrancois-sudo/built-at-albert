# Cron Worker

Wakes on a schedule and calls the application's cron routes. It carries no
business logic, so the rules live in one place and the same endpoints can be
tested by hand.

| Schedule | Route | What it does |
| --- | --- | --- |
| `0 6 * * *` | `/api/cron/claims` | Expires overdue claims, reopens their ideas, sends the two reminders |
| `0 8 * * 1` | `/api/cron/digest` | Weekly summary of new, released and shipped ideas |

## Deploy

```bash
npx wrangler deploy --config worker-cron/wrangler.jsonc
npx wrangler secret put CRON_SECRET --config worker-cron/wrangler.jsonc
```

`APP_URL` lives in `wrangler.jsonc` and must point at the deployed application.
`CRON_SECRET` must be the same value on both Workers.

## Test by hand

```bash
curl -X POST https://<app-domain>/api/cron/claims -H "Authorization: Bearer $CRON_SECRET"
```

Without the header the route answers `401`. Calling it twice in a row is safe:
both database functions mutate and return in a single statement, so the second
run matches no rows and sends nothing.

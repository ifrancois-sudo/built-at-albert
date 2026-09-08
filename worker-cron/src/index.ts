// Companion Worker. It holds no business logic: it wakes on a schedule and
// calls the application's cron routes with the shared secret, so the rules stay
// in one place and the same endpoints can be exercised by hand.

interface Env {
  APP_URL: string;
  CRON_SECRET: string;
}

const DAILY = "0 6 * * *";

async function callCronRoute(env: Env, path: string): Promise<void> {
  const url = new URL(path, env.APP_URL).toString();

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.CRON_SECRET}`,
      "Content-Type": "application/json",
    },
  });

  const body = await response.text();

  if (!response.ok) {
    // Throwing marks the scheduled run as failed, which is what surfaces in the
    // Cloudflare dashboard. The routes are idempotent, so a retry is safe.
    throw new Error(`${path} responded ${response.status}: ${body.slice(0, 300)}`);
  }

  console.log(`[cron] ${path} -> ${body.slice(0, 300)}`);
}

const worker = {
  async scheduled(event: ScheduledController, env: Env): Promise<void> {
    if (!env.CRON_SECRET) throw new Error("CRON_SECRET is not set on the cron Worker");

    if (event.cron === DAILY) {
      await callCronRoute(env, "/api/cron/claims");
      return;
    }

    await callCronRoute(env, "/api/cron/digest");
  },
};

export default worker;

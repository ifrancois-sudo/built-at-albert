export interface Env {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  RESEND_API_KEY?: string;
  RESEND_FROM?: string;
  RESEND_REPLY_TO?: string;
  CRON_SECRET?: string;
  SITE_URL?: string;
}

export function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export async function readJson<T>(request: Request): Promise<T> {
  try {
    return (await request.json()) as T;
  } catch {
    throw new Error("Invalid JSON body");
  }
}

// Length-independent comparison, so a wrong secret cannot be narrowed down by
// timing the response.
function timingSafeEqual(a: string, b: string): boolean {
  const encoder = new TextEncoder();
  const left = encoder.encode(a);
  const right = encoder.encode(b);
  let mismatch = left.length ^ right.length;

  for (let i = 0; i < Math.max(left.length, right.length); i += 1) {
    mismatch |= (left[i] ?? 0) ^ (right[i] ?? 0);
  }

  return mismatch === 0;
}

export function isAuthorisedCron(request: Request, env: Env): boolean {
  if (!env.CRON_SECRET) return false;

  const header = request.headers.get("authorization") ?? "";
  const prefix = "Bearer ";
  if (!header.startsWith(prefix)) return false;

  return timingSafeEqual(header.slice(prefix.length), env.CRON_SECRET);
}

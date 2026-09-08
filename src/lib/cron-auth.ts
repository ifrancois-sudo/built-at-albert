import { serverEnv } from "@/lib/env";

// Length-independent comparison so a wrong secret cannot be narrowed down by
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

export function isAuthorisedCron(request: Request): boolean {
  const expected = serverEnv("CRON_SECRET");
  if (!expected) return false;

  const header = request.headers.get("authorization") ?? "";
  const prefix = "Bearer ";
  if (!header.startsWith(prefix)) return false;

  return timingSafeEqual(header.slice(prefix.length), expected);
}

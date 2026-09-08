import { getCloudflareContext } from "@opennextjs/cloudflare";

type ServerEnv = Record<string, string | undefined>;

// On Workers the bindings live on the Cloudflare context, not on process.env.
// In `next dev` the adapter loads .dev.vars into that same context; the
// process.env fallback covers plain node tooling such as scripts and tests.
function readEnv(): ServerEnv {
  try {
    const { env } = getCloudflareContext();
    if (env) return env as unknown as ServerEnv;
  } catch {
    // Not inside a Cloudflare request context.
  }
  return process.env as ServerEnv;
}

export function serverEnv(key: string): string | undefined {
  const value = readEnv()[key] ?? process.env[key];
  return value === "" ? undefined : value;
}

export function requireServerEnv(key: string): string {
  const value = serverEnv(key);
  if (!value) throw new Error(`Missing server environment variable: ${key}`);
  return value;
}

// Comma-separated list, e.g. "albertschool.com,albertschool.fr".
export function allowedEmailDomains(): string[] {
  return (serverEnv("ALLOWED_EMAIL_DOMAINS") ?? "albertschool.com")
    .split(",")
    .map((domain) => domain.trim().toLowerCase())
    .filter(Boolean);
}

export function isAllowedEmail(email: string): boolean {
  const normalised = email.trim().toLowerCase();
  const at = normalised.lastIndexOf("@");
  if (at < 1) return false;
  return allowedEmailDomains().includes(normalised.slice(at + 1));
}

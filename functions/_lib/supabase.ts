import type { Env } from "./http";

// Thin wrapper over PostgREST with the service role. Deliberately not the
// supabase-js client: these functions make a handful of plain calls and the
// smaller bundle starts faster.

function serviceHeaders(env: Env): HeadersInit {
  return {
    apikey: env.SUPABASE_SERVICE_ROLE_KEY,
    Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
    "Content-Type": "application/json",
  };
}

export async function select<T>(env: Env, path: string): Promise<T[]> {
  const response = await fetch(`${env.SUPABASE_URL}/rest/v1/${path}`, {
    headers: serviceHeaders(env),
  });

  if (!response.ok) {
    throw new Error(`select ${path} failed: ${response.status} ${await response.text()}`);
  }

  return (await response.json()) as T[];
}

export async function rpc<T>(env: Env, name: string, args: unknown = {}): Promise<T> {
  const response = await fetch(`${env.SUPABASE_URL}/rest/v1/rpc/${name}`, {
    method: "POST",
    headers: serviceHeaders(env),
    body: JSON.stringify(args),
  });

  if (!response.ok) {
    throw new Error(`rpc ${name} failed: ${response.status} ${await response.text()}`);
  }

  return (await response.json()) as T;
}

export interface AuthUser {
  id: string;
  email?: string;
  email_confirmed_at?: string | null;
}

/**
 * Resolves the caller's own access token to a user.
 *
 * Asking Supabase rather than decoding the JWT locally means a revoked or
 * expired token is rejected, and it needs no signing secret in the Function.
 */
export async function userFromRequest(request: Request, env: Env): Promise<AuthUser | null> {
  const header = request.headers.get("authorization") ?? "";
  if (!header.startsWith("Bearer ")) return null;

  const response = await fetch(`${env.SUPABASE_URL}/auth/v1/user`, {
    headers: {
      apikey: env.SUPABASE_SERVICE_ROLE_KEY,
      Authorization: header,
    },
  });

  if (!response.ok) return null;

  const user = (await response.json()) as AuthUser;
  return user.email_confirmed_at ? user : null;
}

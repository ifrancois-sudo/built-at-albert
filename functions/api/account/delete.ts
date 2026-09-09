import { json, type Env } from "../../_lib/http";
import { rpc, userFromRequest } from "../../_lib/supabase";

/**
 * Erases the caller's own account.
 *
 * The browser cannot do this: deleting an auth user needs the service role, and
 * handing that to a client would let anyone delete anyone. So the caller proves
 * who they are with their own access token and the function acts on exactly
 * that identity, never on an id supplied in the body.
 *
 * What goes: the auth row, the profile behind it, and the person's own votes,
 * which the cascade removes and the counter trigger decrements. What stays:
 * the ideas they wrote and the tools they delivered, detached from any name.
 * Erasing those would take other students' votes and a working tool down with
 * them, which the right to erasure does not require.
 */
export const onRequest: PagesFunction<Env> = async ({ request, env }) => {
  if (request.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  const caller = await userFromRequest(request, env);
  if (!caller) return json({ error: "unauthorized" }, 401);

  try {
    // Anything they were holding goes back on the board first, so no idea is
    // left reserved by an account that no longer exists.
    const freed = await rpc<number>(env, "release_claims_for_user", { p_user_id: caller.id });

    const deletion = await fetch(`${env.SUPABASE_URL}/auth/v1/admin/users/${caller.id}`, {
      method: "DELETE",
      headers: {
        apikey: env.SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
      },
    });

    if (!deletion.ok) {
      console.error("[account/delete] auth deletion refused", deletion.status, await deletion.text());
      return json({ error: "failed" }, 500);
    }

    return json({ deleted: true, claimsReleased: freed });
  } catch (error) {
    console.error("[account/delete] failed", error);
    return json({ error: "failed" }, 500);
  }
};

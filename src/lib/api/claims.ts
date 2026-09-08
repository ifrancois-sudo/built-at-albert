import { supabase } from "@/lib/supabase/client";
import { notify } from "@/lib/api/notify";

// Every reservation move goes through a definer function that re-checks the
// caller in Postgres. The client never writes the claims table directly, and
// the partial unique index is what actually settles a race between two
// students clicking at the same moment.

export async function claimIdea(ideaId: string) {
  const result = await supabase().rpc("claim_idea", { p_idea_id: ideaId });
  if (!result.error && result.data) {
    await notify({ type: "claim_created", claimId: result.data.id });
  }
  return result;
}

export async function releaseClaim(claimId: string) {
  return supabase().rpc("release_claim", { p_claim_id: claimId });
}

export async function extendClaim(claimId: string) {
  return supabase().rpc("extend_claim", { p_claim_id: claimId });
}

export async function listMyActiveClaims(userId: string) {
  return supabase()
    .from("claims")
    .select("*")
    .eq("user_id", userId)
    .eq("status", "active")
    .order("expires_at", { ascending: true });
}

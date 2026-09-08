import { supabase } from "@/lib/supabase/client";
import { notify } from "@/lib/api/notify";
import type { UserRole } from "@/lib/database.types";
import { PROFILE_COLUMNS } from "@/lib/api/profiles";

export async function moderateIdea(ideaId: string, approve: boolean, reason: string | null) {
  const result = await supabase().rpc("moderate_idea", {
    p_idea_id: ideaId,
    p_approve: approve,
    p_reason: approve ? null : reason,
  });

  // The author hears back either way. A rejection with no explanation is the
  // fastest way to lose a contributor.
  if (!result.error && result.data) {
    await notify({ type: "idea_moderated", ideaId: result.data.id });
  }

  return result;
}

export async function setUserRole(userId: string, role: UserRole) {
  return supabase().rpc("set_user_role", { p_user_id: userId, p_role: role });
}

export async function setProjectVisibility(projectId: string, isPublic: boolean) {
  return supabase().rpc("set_project_visibility", {
    p_project_id: projectId,
    p_is_public: isPublic,
  });
}

export async function listPendingIdeas() {
  return supabase().from("ideas").select("*").eq("status", "pending").order("created_at");
}

export async function listActiveClaims() {
  return supabase().from("claims").select("*").eq("status", "active").order("expires_at");
}

export async function listAllProjects() {
  return supabase().from("projects").select("*").order("published_at", { ascending: false });
}

export async function listMembers() {
  return supabase()
    .from("profiles")
    .select(PROFILE_COLUMNS)
    .order("created_at", { ascending: false })
    .limit(200);
}

"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabase } from "@/lib/supabase/server";
import { errorMessageKey } from "@/lib/errors";
import { actionError, actionSuccess, type ActionState } from "@/lib/action-state";
import { sendIdeaModeratedEmail } from "@/lib/email";

export async function moderateIdeaAction(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const ideaId = String(formData.get("idea_id") ?? "");
  const approve = String(formData.get("decision") ?? "") === "approve";
  const reason = String(formData.get("reason") ?? "").trim();

  if (!approve && reason.length === 0) return actionError("errors.reason_required");

  const supabase = await createServerSupabase();
  const { data, error } = await supabase.rpc("moderate_idea", {
    p_idea_id: ideaId,
    p_approve: approve,
    p_reason: approve ? null : reason,
  });

  if (error) return actionError(errorMessageKey(error));

  // The author hears back either way; a rejection with no explanation is the
  // fastest way to lose a contributor.
  if (data) await sendIdeaModeratedEmail(data);

  revalidatePath("/admin");
  revalidatePath("/ideas");
  return actionSuccess(approve ? "admin.approved" : "admin.rejected");
}

export async function setUserRoleAction(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const userId = String(formData.get("user_id") ?? "");
  const role = String(formData.get("role") ?? "") === "admin" ? "admin" : "student";

  const supabase = await createServerSupabase();
  const { error } = await supabase.rpc("set_user_role", { p_user_id: userId, p_role: role });
  if (error) return actionError(errorMessageKey(error));

  revalidatePath("/admin");
  return actionSuccess("admin.roleUpdated");
}

export async function setProjectVisibilityAction(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const projectId = String(formData.get("project_id") ?? "");
  const isPublic = String(formData.get("is_public") ?? "") === "true";

  const supabase = await createServerSupabase();
  const { error } = await supabase.rpc("set_project_visibility", {
    p_project_id: projectId,
    p_is_public: isPublic,
  });
  if (error) return actionError(errorMessageKey(error));

  revalidatePath("/admin");
  revalidatePath("/projects");
  return actionSuccess("admin.roleUpdated");
}

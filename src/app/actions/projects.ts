"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabase } from "@/lib/supabase/server";
import { errorMessageKey } from "@/lib/errors";
import { actionError, actionSuccess, type ActionState } from "@/lib/action-state";
import { isHttpUrl } from "@/lib/format";
import { sendIdeaDeliveredEmail } from "@/lib/email";

export async function submitProjectAction(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const claimId = String(formData.get("claim_id") ?? "");
  const url = String(formData.get("url") ?? "").trim();
  const repoUrl = String(formData.get("repo_url") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const screenshots = formData
    .getAll("screenshots")
    .map((value) => String(value).trim())
    .filter(Boolean);

  if (!isHttpUrl(url)) return actionError("delivery.errorUrl");
  if (repoUrl.length > 0 && !isHttpUrl(repoUrl)) return actionError("delivery.errorUrl");
  if (screenshots.length < 1 || screenshots.length > 3) return actionError("delivery.errorScreenshots");

  const supabase = await createServerSupabase();

  // One call moves the project, the claim and the idea together; a partial
  // delivery would leave an idea stuck in 'claimed' with nothing to show.
  const { data: project, error } = await supabase.rpc("submit_project", {
    p_claim_id: claimId,
    p_url: url,
    p_description: description,
    p_screenshots: screenshots,
    p_repo_url: repoUrl.length > 0 ? repoUrl : null,
  });

  if (error) return actionError(errorMessageKey(error));

  if (project) {
    const { data: idea } = await supabase
      .from("ideas")
      .select("id, title, author_id")
      .eq("id", project.idea_id)
      .maybeSingle();

    if (idea && idea.author_id !== project.author_id) {
      await sendIdeaDeliveredEmail(idea.author_id, idea.id, idea.title);
    }
  }

  revalidatePath("/projects");
  revalidatePath("/ideas");
  revalidatePath("/me");
  return actionSuccess("delivery.done");
}

"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase/server";
import { errorMessageKey } from "@/lib/errors";
import { actionError, actionSuccess, type ActionState } from "@/lib/action-state";
import { parseTags } from "@/lib/format";
import { isLocale } from "@/i18n";
import { sendClaimConfirmedEmail, sendIdeaClaimedEmail } from "@/lib/email";
import { displayName } from "@/lib/data/profiles";

export async function submitIdeaAction(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const title = String(formData.get("title") ?? "").trim();
  const problem = String(formData.get("problem") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const language = String(formData.get("language") ?? "fr");
  const campus = String(formData.get("campus") ?? "").trim();

  if (title.length < 3 || title.length > 120) return actionError("ideas.fieldTitleHint");
  if (problem.length < 10) return actionError("ideas.fieldProblemHint");

  const supabase = await createServerSupabase();

  // author_id, status and vote_count are overwritten by a trigger whatever the
  // client sends, so the insert cannot smuggle in a pre-approved idea.
  const { error } = await supabase.from("ideas").insert({
    title,
    problem,
    description,
    language: isLocale(language) ? language : "fr",
    tags: parseTags(String(formData.get("tags") ?? "")),
    campus: campus.length > 0 ? campus : null,
  });

  if (error) return actionError(errorMessageKey(error));

  revalidatePath("/ideas");
  revalidatePath("/me");
  return actionSuccess("ideas.newDone");
}

export async function toggleVoteAction(ideaId: string, hasVoted: boolean): Promise<void> {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  if (hasVoted) {
    await supabase.from("votes").delete().eq("idea_id", ideaId).eq("user_id", user.id);
  } else {
    await supabase.from("votes").insert({ idea_id: ideaId, user_id: user.id });
  }

  revalidatePath("/ideas");
  revalidatePath(`/ideas/${ideaId}`);
}

export async function claimIdeaAction(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const ideaId = String(formData.get("idea_id") ?? "");
  const supabase = await createServerSupabase();

  const { data: claim, error } = await supabase.rpc("claim_idea", { p_idea_id: ideaId });
  if (error) return actionError(errorMessageKey(error));

  if (claim) {
    const [{ data: idea }, { data: builder }] = await Promise.all([
      supabase.from("ideas").select("id, title, author_id").eq("id", ideaId).maybeSingle(),
      supabase
        .from("profiles")
        .select("id, full_name, promo, campus, role, locale, created_at")
        .eq("id", claim.user_id)
        .maybeSingle(),
    ]);

    if (idea) {
      await sendClaimConfirmedEmail(claim.user_id, idea.title, claim.expires_at);
      if (idea.author_id !== claim.user_id) {
        await sendIdeaClaimedEmail(
          idea.author_id,
          idea.id,
          idea.title,
          displayName(builder ?? undefined, "Un élève"),
        );
      }
    }
  }

  revalidatePath("/ideas");
  revalidatePath(`/ideas/${ideaId}`);
  revalidatePath("/me");
  return actionSuccess("claim.done");
}

export async function releaseClaimAction(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const claimId = String(formData.get("claim_id") ?? "");
  const supabase = await createServerSupabase();

  const { error } = await supabase.rpc("release_claim", { p_claim_id: claimId });
  if (error) return actionError(errorMessageKey(error));

  revalidatePath("/ideas");
  revalidatePath("/me");
  revalidatePath("/admin");
  return actionSuccess("claim.released");
}

export async function extendClaimAction(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const claimId = String(formData.get("claim_id") ?? "");
  const supabase = await createServerSupabase();

  const { data, error } = await supabase.rpc("extend_claim", { p_claim_id: claimId });
  if (error) return actionError(errorMessageKey(error));

  revalidatePath("/me");
  return actionSuccess("claim.extended", { date: data?.expires_at ?? "" });
}

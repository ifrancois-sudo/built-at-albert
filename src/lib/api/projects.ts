import { supabase } from "@/lib/supabase/client";
import { notify } from "@/lib/api/notify";
import type { ProjectRow } from "@/lib/database.types";

export interface DeliveryInput {
  claimId: string;
  url: string;
  repoUrl: string;
  description: string;
  screenshots: string[];
}

// One call moves the project, the claim and the idea together. A partial
// delivery would leave an idea stuck in 'claimed' with nothing to show for it.
export async function submitProject(input: DeliveryInput) {
  const result = await supabase().rpc("submit_project", {
    p_claim_id: input.claimId,
    p_url: input.url,
    p_description: input.description,
    p_screenshots: input.screenshots,
    p_repo_url: input.repoUrl.length > 0 ? input.repoUrl : null,
  });

  if (!result.error && result.data) {
    await notify({ type: "project_delivered", projectId: result.data.id });
  }

  return result;
}

/** Uploads one screenshot and returns its public URL. */
export async function uploadScreenshot(userId: string, file: File): Promise<string | null> {
  const extension = file.name.split(".").pop()?.toLowerCase() ?? "png";
  // The storage policy only accepts a path whose first folder is the caller's
  // own user id, so this shape is not a convention, it is the rule.
  const path = `${userId}/${crypto.randomUUID()}.${extension}`;

  const { error } = await supabase().storage.from("screenshots").upload(path, file, {
    contentType: file.type,
    upsert: false,
  });

  if (error) return null;
  return supabase().storage.from("screenshots").getPublicUrl(path).data.publicUrl;
}

export async function listPublicProjects(): Promise<ProjectRow[]> {
  const { data } = await supabase()
    .from("projects")
    .select("*")
    .eq("is_public", true)
    .order("published_at", { ascending: false });
  return data ?? [];
}

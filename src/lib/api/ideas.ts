import { supabase } from "@/lib/supabase/client";
import type { ClaimRow, IdeaRow, ProfileRow, ProjectRow } from "@/lib/database.types";
import { fetchProfiles } from "@/lib/api/profiles";
import { parseTags } from "@/lib/format";
import type { Locale } from "@/i18n";

export interface IdeaCardModel {
  idea: IdeaRow;
  author: ProfileRow | undefined;
  hasVoted: boolean;
}

export interface IdeaDetailModel extends IdeaCardModel {
  activeClaim: ClaimRow | null;
  claimant: ProfileRow | undefined;
  project: ProjectRow | null;
}

export type IdeaSort = "votes" | "recent";

export interface IdeaFilters {
  sort: IdeaSort;
  tag?: string;
  campus?: string;
}

export async function listOpenIdeas(
  viewerId: string,
  filters: IdeaFilters,
): Promise<IdeaCardModel[]> {
  let query = supabase().from("ideas").select("*").in("status", ["open", "claimed"]).limit(200);

  if (filters.tag) query = query.contains("tags", [filters.tag]);
  if (filters.campus) query = query.eq("campus", filters.campus);

  query =
    filters.sort === "recent"
      ? query.order("created_at", { ascending: false })
      : query.order("vote_count", { ascending: false }).order("created_at", { ascending: false });

  const { data: ideas } = await query;
  if (!ideas || ideas.length === 0) return [];

  const [profiles, votes] = await Promise.all([
    fetchProfiles(ideas.map((idea) => idea.author_id)),
    supabase()
      .from("votes")
      .select("idea_id")
      .eq("user_id", viewerId)
      .in("idea_id", ideas.map((idea) => idea.id)),
  ]);

  const voted = new Set((votes.data ?? []).map((vote) => vote.idea_id));

  return ideas.map((idea) => ({
    idea,
    author: profiles.get(idea.author_id),
    hasVoted: voted.has(idea.id),
  }));
}

export async function getIdeaDetail(
  ideaId: string,
  viewerId: string,
): Promise<IdeaDetailModel | null> {
  const { data: idea } = await supabase().from("ideas").select("*").eq("id", ideaId).maybeSingle();
  if (!idea) return null;

  const [claimResult, voteResult, projectResult] = await Promise.all([
    supabase().from("claims").select("*").eq("idea_id", ideaId).eq("status", "active").maybeSingle(),
    supabase()
      .from("votes")
      .select("idea_id")
      .eq("idea_id", ideaId)
      .eq("user_id", viewerId)
      .maybeSingle(),
    supabase().from("projects").select("*").eq("idea_id", ideaId).maybeSingle(),
  ]);

  const activeClaim = claimResult.data ?? null;
  const profiles = await fetchProfiles(
    [idea.author_id, activeClaim?.user_id].filter((id): id is string => Boolean(id)),
  );

  return {
    idea,
    author: profiles.get(idea.author_id),
    hasVoted: Boolean(voteResult.data),
    activeClaim,
    claimant: activeClaim ? profiles.get(activeClaim.user_id) : undefined,
    project: projectResult.data ?? null,
  };
}

// Filter options come from what is actually on the board, so an empty platform
// shows no filters rather than a list of dead choices.
export async function listFacets(): Promise<{ tags: string[]; campuses: string[] }> {
  const { data } = await supabase()
    .from("ideas")
    .select("tags, campus")
    .in("status", ["open", "claimed"])
    .limit(500);

  const tags = new Set<string>();
  const campuses = new Set<string>();

  for (const row of data ?? []) {
    for (const tag of row.tags ?? []) tags.add(tag);
    if (row.campus) campuses.add(row.campus);
  }

  return { tags: Array.from(tags).sort(), campuses: Array.from(campuses).sort() };
}

export interface NewIdeaInput {
  title: string;
  problem: string;
  description: string;
  language: Locale;
  tags: string;
  campus: string | null;
}

// status, author_id and vote_count are not in the client's column grant at all,
// and a trigger overwrites them regardless. Submissions are always pending.
export async function submitIdea(input: NewIdeaInput) {
  return supabase().from("ideas").insert({
    title: input.title,
    problem: input.problem,
    description: input.description,
    language: input.language,
    tags: parseTags(input.tags),
    campus: input.campus,
  });
}

export async function toggleVote(ideaId: string, userId: string, hasVoted: boolean) {
  return hasVoted
    ? supabase().from("votes").delete().eq("idea_id", ideaId).eq("user_id", userId)
    : supabase().from("votes").insert({ idea_id: ideaId, user_id: userId });
}

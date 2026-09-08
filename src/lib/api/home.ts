import { supabase } from "@/lib/supabase/client";
import { fetchProfiles } from "@/lib/api/profiles";
import type {
  ClaimRow,
  IdeaRow,
  IdeaStatus,
  ProfileRow,
  ProjectRow,
} from "@/lib/database.types";

export interface HomeSnapshot {
  counts: { open: number; claimed: number; delivered: number };
  topIdeas: { idea: IdeaRow; author: ProfileRow | undefined; hasVoted: boolean }[];
  latestProjects: { project: ProjectRow; ideaTitle: string }[];
  myClaims: { claim: ClaimRow; ideaTitle: string }[];
}

async function countIdeas(status: IdeaStatus): Promise<number> {
  const { count } = await supabase()
    .from("ideas")
    .select("id", { count: "exact", head: true })
    .eq("status", status);
  return count ?? 0;
}

// One loader for the whole page: the figures at the top and the cards below
// have to describe the same moment, or the board says 24 open ideas while
// listing one that was claimed a second ago.
export async function loadHome(viewerId: string): Promise<HomeSnapshot> {
  const [open, claimed, delivered, topResult, projectResult, claimResult] = await Promise.all([
    countIdeas("open"),
    countIdeas("claimed"),
    countIdeas("delivered"),
    supabase()
      .from("ideas")
      .select("*")
      .eq("status", "open")
      .order("vote_count", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(3),
    supabase()
      .from("projects")
      .select("*")
      .eq("is_public", true)
      .order("published_at", { ascending: false })
      .limit(3),
    supabase()
      .from("claims")
      .select("*")
      .eq("user_id", viewerId)
      .eq("status", "active")
      .order("expires_at", { ascending: true }),
  ]);

  const topIdeas = topResult.data ?? [];
  const projects = projectResult.data ?? [];
  const claims = claimResult.data ?? [];

  const relatedIdeaIds = [
    ...projects.map((project) => project.idea_id),
    ...claims.map((claim) => claim.idea_id),
  ];

  const [authors, votes, relatedIdeas] = await Promise.all([
    fetchProfiles(topIdeas.map((idea) => idea.author_id)),
    topIdeas.length > 0
      ? supabase()
          .from("votes")
          .select("idea_id")
          .eq("user_id", viewerId)
          .in("idea_id", topIdeas.map((idea) => idea.id))
      : Promise.resolve({ data: [] as { idea_id: string }[] }),
    relatedIdeaIds.length > 0
      ? supabase().from("ideas").select("id, title").in("id", relatedIdeaIds)
      : Promise.resolve({ data: [] as { id: string; title: string }[] }),
  ]);

  const voted = new Set((votes.data ?? []).map((vote) => vote.idea_id));
  const titles = new Map((relatedIdeas.data ?? []).map((idea) => [idea.id, idea.title]));

  return {
    counts: { open, claimed, delivered },
    topIdeas: topIdeas.map((idea) => ({
      idea,
      author: authors.get(idea.author_id),
      hasVoted: voted.has(idea.id),
    })),
    latestProjects: projects.map((project) => ({
      project,
      ideaTitle: titles.get(project.idea_id) ?? "—",
    })),
    myClaims: claims.map((claim) => ({
      claim,
      ideaTitle: titles.get(claim.idea_id) ?? "—",
    })),
  };
}

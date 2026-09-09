"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useSession } from "@/lib/session";
import { useLocale, useT } from "@/i18n/provider";
import { RequireSession } from "@/components/require-session";
import { StatusBadge } from "@/components/status-badge";
import { ClaimTracker } from "@/app/me/claim-tracker";
import { ProfileForm } from "@/components/profile-form";
import { DeleteAccount } from "@/components/delete-account";
import { supabase } from "@/lib/supabase/client";
import { listMyActiveClaims } from "@/lib/api/claims";
import { formatDate } from "@/lib/format";
import type { ClaimRow, IdeaRow, ProjectRow } from "@/lib/database.types";

export default function MySpacePage() {
  return (
    <RequireSession>
      <MySpace />
    </RequireSession>
  );
}

function MySpace() {
  const t = useT();
  const { locale } = useLocale();
  const { user } = useSession();
  const userId = user?.id ?? "";

  // Loaded as one bundle so the page never renders half a state: claims from
  // this fetch next to projects from the previous one.
  interface Snapshot {
    claims: ClaimRow[];
    claimTitles: Map<string, string>;
    ideas: IdeaRow[];
    projects: ProjectRow[];
  }

  const [data, setData] = useState<Snapshot | null>(null);

  const load = useCallback(async (): Promise<Snapshot> => {
    const [claimResult, ideaResult, projectResult] = await Promise.all([
      listMyActiveClaims(userId),
      supabase().from("ideas").select("*").eq("author_id", userId).order("created_at", { ascending: false }),
      supabase().from("projects").select("*").eq("author_id", userId).order("published_at", { ascending: false }),
    ]);

    const activeClaims = claimResult.data ?? [];
    let claimTitles = new Map<string, string>();

    if (activeClaims.length > 0) {
      const { data: titles } = await supabase()
        .from("ideas")
        .select("id, title")
        .in("id", activeClaims.map((claim) => claim.idea_id));
      claimTitles = new Map((titles ?? []).map((idea) => [idea.id, idea.title]));
    }

    return {
      claims: activeClaims,
      claimTitles,
      ideas: ideaResult.data ?? [],
      projects: projectResult.data ?? [],
    };
  }, [userId]);

  const refresh = useCallback(async () => {
    setData(await load());
  }, [load]);

  useEffect(() => {
    let cancelled = false;
    void load().then((next) => {
      if (!cancelled) setData(next);
    });
    return () => {
      cancelled = true;
    };
  }, [load]);

  if (!data) {
    return <p className="mx-auto max-w-4xl px-4 py-24 text-ink-faint sm:px-6">{t("common.loading")}</p>;
  }

  return (
    <div className="mx-auto max-w-5xl px-5 py-14 sm:px-6">
      <h1 className="text-3xl">{t("me.title")}</h1>

      <section className="mt-10">
        <h2 className="text-xl">{t("me.myClaims")}</h2>
        {data.claims.length === 0 ? (
          <p className="surface mt-4 p-7 text-ink-faint">{t("me.noClaims")}</p>
        ) : (
          <div className="mt-4 flex flex-col gap-4">
            {data.claims.map((claim) => (
              <ClaimTracker
                key={claim.id}
                claim={claim}
                ideaTitle={data.claimTitles.get(claim.idea_id) ?? "—"}
                userId={userId}
                onChanged={refresh}
              />
            ))}
          </div>
        )}
      </section>

      <section className="mt-12">
        <h2 className="text-xl">{t("me.myIdeas")}</h2>
        {data.ideas.length === 0 ? (
          <p className="surface mt-4 p-7 text-ink-faint">{t("me.noIdeas")}</p>
        ) : (
          <ul className="mt-4 flex flex-col gap-2">
            {data.ideas.map((idea) => (
              <li key={idea.id} className="surface flex flex-wrap items-center gap-3 p-4">
                <StatusBadge status={idea.status} />
                <Link href={`/idea/?id=${idea.id}`} className="flex-1 hover:text-accent-ink">
                  {idea.title}
                </Link>
                <span className="text-ink-faint">
                  {t.plural("ideas.voteCount", "ideas.voteCountPlural", idea.vote_count)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-12">
        <h2 className="text-xl">{t("me.myProjects")}</h2>
        {data.projects.length === 0 ? (
          <p className="surface mt-4 p-7 text-ink-faint">{t("me.noProjects")}</p>
        ) : (
          <ul className="mt-4 flex flex-col gap-2">
            {data.projects.map((project) => (
              <li key={project.id} className="surface flex flex-wrap items-center gap-3 p-4">
                <a
                  href={project.url}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="flex-1 truncate underline underline-offset-4 hover:text-accent-ink"
                >
                  {project.url}
                </a>
                <span className="text-ink-faint">
                  {formatDate(project.published_at, locale)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-12">
        <h2 className="text-xl">{t("profile.title")}</h2>
        <ProfileForm />
      </section>

      <DeleteAccount />

    </div>
  );
}

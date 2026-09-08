import type { Metadata } from "next";
import Link from "next/link";
import { requireViewer } from "@/lib/auth";
import { createServerSupabase } from "@/lib/supabase/server";
import { getLocale, getTranslator } from "@/i18n/server";
import { formatDate } from "@/lib/format";
import { StatusBadge } from "@/components/status-badge";
import { ClaimTracker } from "./claim-tracker";

export const metadata: Metadata = { title: "Mon espace" };

export default async function MySpacePage() {
  const viewer = await requireViewer();
  const [t, locale] = await Promise.all([getTranslator(), getLocale()]);
  const supabase = await createServerSupabase();

  const [ideasResult, claimsResult, projectsResult] = await Promise.all([
    supabase
      .from("ideas")
      .select("*")
      .eq("author_id", viewer.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("claims")
      .select("*")
      .eq("user_id", viewer.id)
      .eq("status", "active")
      .order("expires_at", { ascending: true }),
    supabase
      .from("projects")
      .select("*")
      .eq("author_id", viewer.id)
      .order("published_at", { ascending: false }),
  ]);

  const claims = claimsResult.data ?? [];
  const claimIdeas = new Map(
    claims.length > 0
      ? (
          await supabase
            .from("ideas")
            .select("id, title")
            .in(
              "id",
              claims.map((claim) => claim.idea_id),
            )
        ).data?.map((idea) => [idea.id, idea.title]) ?? []
      : [],
  );

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <h1 className="text-3xl">{t("me.title")}</h1>

      <section className="mt-10">
        <h2 className="text-xl">{t("me.myClaims")}</h2>
        {claims.length === 0 ? (
          <p className="surface mt-4 p-6 text-sm text-ink-faint">{t("me.noClaims")}</p>
        ) : (
          <div className="mt-4 flex flex-col gap-4">
            {claims.map((claim) => (
              <ClaimTracker
                key={claim.id}
                claimId={claim.id}
                ideaId={claim.idea_id}
                ideaTitle={claimIdeas.get(claim.idea_id) ?? "—"}
                expiresAt={claim.expires_at}
                expiresLabel={formatDate(claim.expires_at, locale)}
              />
            ))}
          </div>
        )}
      </section>

      <section className="mt-12">
        <h2 className="text-xl">{t("me.myIdeas")}</h2>
        {(ideasResult.data ?? []).length === 0 ? (
          <p className="surface mt-4 p-6 text-sm text-ink-faint">{t("me.noIdeas")}</p>
        ) : (
          <ul className="mt-4 flex flex-col gap-2">
            {(ideasResult.data ?? []).map((idea) => (
              <li key={idea.id} className="surface flex flex-wrap items-center gap-3 p-4">
                <StatusBadge status={idea.status} t={t} />
                <Link href={`/ideas/${idea.id}`} className="flex-1 hover:text-accent-ink">
                  {idea.title}
                </Link>
                <span className="text-sm text-ink-faint">
                  {t.plural("ideas.voteCount", "ideas.voteCountPlural", idea.vote_count)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-12">
        <h2 className="text-xl">{t("me.myProjects")}</h2>
        {(projectsResult.data ?? []).length === 0 ? (
          <p className="surface mt-4 p-6 text-sm text-ink-faint">{t("me.noProjects")}</p>
        ) : (
          <ul className="mt-4 flex flex-col gap-2">
            {(projectsResult.data ?? []).map((project) => (
              <li key={project.id} className="surface flex flex-wrap items-center gap-3 p-4">
                <a
                  href={project.url}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="flex-1 underline underline-offset-4 hover:text-accent-ink"
                >
                  {project.url}
                </a>
                <span className="text-sm text-ink-faint">
                  {formatDate(project.published_at, locale)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

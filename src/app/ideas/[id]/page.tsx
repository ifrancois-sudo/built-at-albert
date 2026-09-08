import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireViewer } from "@/lib/auth";
import { createServerSupabase } from "@/lib/supabase/server";
import { getLocale, getTranslator } from "@/i18n/server";
import { getIdeaDetail } from "@/lib/data/ideas";
import { displayName } from "@/lib/data/profiles";
import { formatDate } from "@/lib/format";
import { StatusBadge } from "@/components/status-badge";
import { VoteButton } from "@/components/vote-button";
import { ClaimPanel } from "./claim-panel";

export const metadata: Metadata = { title: "Idée" };

export default async function IdeaDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const viewer = await requireViewer();
  const [t, locale, { id }] = await Promise.all([getTranslator(), getLocale(), params]);

  const supabase = await createServerSupabase();
  const detail = await getIdeaDetail(supabase, id, viewer.id);
  if (!detail) notFound();

  const { idea, author, activeClaim, claimant, project } = detail;
  const isAuthor = idea.author_id === viewer.id;
  const isClaimant = activeClaim?.user_id === viewer.id;

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <Link href="/ideas" className="text-sm text-ink-faint underline underline-offset-4 hover:text-ink">
        {t("common.back")}
      </Link>

      <div className="mt-5 flex flex-wrap items-center gap-2">
        <StatusBadge status={idea.status} t={t} />
        <span className="badge bg-paper-sunk text-ink-faint uppercase">{idea.language}</span>
        {idea.campus ? <span className="badge bg-paper-sunk text-ink-faint">{idea.campus}</span> : null}
      </div>

      <h1 className="mt-3 text-[clamp(1.9rem,4.5vw,2.75rem)] leading-tight">{idea.title}</h1>

      <div className="mt-4 flex flex-wrap items-center gap-4">
        <VoteButton
          ideaId={idea.id}
          count={idea.vote_count}
          hasVoted={detail.hasVoted}
          isOwn={isAuthor}
        />
        <p className="text-sm text-ink-faint">
          {t("ideas.byAuthor", { name: displayName(author, "—") })} ·{" "}
          {formatDate(idea.created_at, locale)}
        </p>
      </div>

      {idea.status === "rejected" && isAuthor ? (
        <div className="mt-6 rounded-lg border border-bad/25 bg-bad-soft p-4">
          <p className="text-sm font-semibold text-bad">{t("ideas.rejectedReason")}</p>
          <p className="mt-1 text-sm text-bad">{idea.rejected_reason}</p>
        </div>
      ) : null}

      <section className="mt-8">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-faint">
          {t("ideas.problemLabel")}
        </h2>
        <p className="prose-body mt-2 whitespace-pre-line">{idea.problem}</p>
      </section>

      {idea.description ? (
        <section className="mt-6">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-faint">
            {t("ideas.descriptionLabel")}
          </h2>
          <p className="prose-body mt-2 whitespace-pre-line">{idea.description}</p>
        </section>
      ) : null}

      {idea.tags.length > 0 ? (
        <ul className="mt-6 flex flex-wrap gap-2">
          {idea.tags.map((tag) => (
            <li key={tag} className="badge bg-paper-sunk text-ink-faint">
              #{tag}
            </li>
          ))}
        </ul>
      ) : null}

      {project ? (
        <section className="surface mt-10 p-6">
          <h2 className="text-xl">{t("gallery.openTool")}</h2>
          <p className="prose-body mt-2 text-sm">{project.description}</p>
          <div className="mt-4 flex flex-wrap gap-3">
            <a href={project.url} target="_blank" rel="noreferrer noopener" className="btn btn-primary">
              {t("ideas.deliveredCta")}
            </a>
            {project.repo_url ? (
              <a
                href={project.repo_url}
                target="_blank"
                rel="noreferrer noopener"
                className="btn btn-secondary"
              >
                {t("gallery.viewRepo")}
              </a>
            ) : null}
          </div>
        </section>
      ) : (
        <ClaimPanel
          ideaId={idea.id}
          ideaStatus={idea.status}
          claim={
            activeClaim
              ? {
                  id: activeClaim.id,
                  expiresAt: activeClaim.expires_at,
                  claimantName: displayName(claimant, "—"),
                  isMine: isClaimant,
                }
              : null
          }
          expiresLabel={activeClaim ? formatDate(activeClaim.expires_at, locale) : ""}
        />
      )}
    </div>
  );
}

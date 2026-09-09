"use client";

import Link from "next/link";
import { Suspense, useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useSession } from "@/lib/session";
import { useLocale, useT } from "@/i18n/provider";
import { RequireSession } from "@/components/require-session";
import { StatusBadge } from "@/components/status-badge";
import { VoteButton } from "@/components/vote-button";
import { FormMessage } from "@/components/form-message";
import { getIdeaDetail, type IdeaDetailModel } from "@/lib/api/ideas";
import { claimIdea, releaseClaim } from "@/lib/api/claims";
import { displayName } from "@/lib/api/profiles";
import { errorMessageKey } from "@/lib/errors";
import { formatDate } from "@/lib/format";
import { CLAIM_DAYS, CLAIM_EXTENSION_DAYS, MAX_ACTIVE_CLAIMS } from "@/lib/public-config";
import type { MessageKey } from "@/i18n";

// A static export cannot pre-render one file per idea, so the id travels as a
// query parameter instead of a path segment.
export default function IdeaPage() {
  return (
    <RequireSession>
      <Suspense fallback={null}>
        <IdeaDetail />
      </Suspense>
    </RequireSession>
  );
}

function IdeaDetail() {
  const t = useT();
  const { locale } = useLocale();
  const { user } = useSession();
  const viewerId = user?.id ?? "";
  const ideaId = useSearchParams().get("id") ?? "";

  const [detail, setDetail] = useState<IdeaDetailModel | null | undefined>(undefined);
  const [message, setMessage] = useState<{ tone: "error" | "success"; key: MessageKey } | null>(null);
  const [pending, setPending] = useState(false);
  const [showRules, setShowRules] = useState(false);

  const load = useCallback(
    async () => (ideaId ? getIdeaDetail(ideaId, viewerId) : null),
    [ideaId, viewerId],
  );

  useEffect(() => {
    let cancelled = false;
    void load().then((next) => {
      if (!cancelled) setDetail(next);
    });
    return () => {
      cancelled = true;
    };
  }, [load]);

  if (detail === undefined) {
    return <p className="mx-auto max-w-3xl px-4 py-24 text-ink-faint sm:px-6">{t("common.loading")}</p>;
  }

  if (detail === null) {
    return (
      <div className="mx-auto max-w-3xl px-5 py-24 sm:px-6">
        <p className="text-ink-faint">{t("errors.idea_not_found")}</p>
        <Link href="/ideas/" className="btn btn-secondary mt-4">
          {t("common.back")}
        </Link>
      </div>
    );
  }

  const { idea, author, activeClaim, claimant, project } = detail;
  const isAuthor = idea.author_id === viewerId;
  const isClaimant = activeClaim?.user_id === viewerId;

  async function run(action: () => Promise<{ error: unknown }>, successKey: MessageKey) {
    setPending(true);
    setMessage(null);
    const { error } = await action();
    setPending(false);

    if (error) {
      setMessage({ tone: "error", key: errorMessageKey(error) });
      return;
    }

    setMessage({ tone: "success", key: successKey });
    setShowRules(false);
    setDetail(await load());
  }

  return (
    <div className="mx-auto max-w-3xl px-5 py-14 sm:px-6">
      <Link href="/ideas/" className="text-sm text-ink-faint underline underline-offset-4 hover:text-ink">
        {t("common.back")}
      </Link>

      <div className="mt-5 flex flex-wrap items-center gap-2">
        <StatusBadge status={idea.status} />
        <span className="badge bg-paper-sunk uppercase text-ink-faint">{idea.language}</span>
        {idea.campus ? <span className="badge bg-paper-sunk text-ink-faint">{idea.campus}</span> : null}
      </div>

      <h1 className="mt-3 text-[clamp(1.9rem,4.5vw,2.75rem)] leading-tight">{idea.title}</h1>

      <div className="mt-4 flex flex-wrap items-center gap-4">
        <VoteButton
          ideaId={idea.id}
          userId={viewerId}
          count={idea.vote_count}
          hasVoted={detail.hasVoted}
          isOwn={isAuthor}
        />
        <p className="text-ink-faint">
          {t("ideas.byAuthor", { name: displayName(author, t("common.deletedAccount")) })} ·{" "}
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

      {message ? (
        <div className="mt-6">
          <FormMessage tone={message.tone} messageKey={message.key} />
        </div>
      ) : null}

      {project ? (
        <section className="surface mt-10 p-6">
          <h2 className="text-xl">{t("gallery.openTool")}</h2>
          <p className="prose-body mt-2">{project.description}</p>
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
      ) : activeClaim ? (
        <section className="surface mt-10 p-6">
          <p >
            {t("ideas.claimedBy", { name: displayName(claimant, "—") })}{" "}
            <span className="text-ink-faint">
              {t("ideas.claimedUntil", { date: formatDate(activeClaim.expires_at, locale) })}
            </span>
          </p>

          {isClaimant ? (
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <Link href="/me/" className="btn btn-primary">
                {t("claim.deliverCta")}
              </Link>
              <button
                type="button"
                className="btn btn-danger"
                disabled={pending}
                onClick={() => run(() => releaseClaim(activeClaim.id), "claim.released")}
              >
                {t("claim.release")}
              </button>
            </div>
          ) : null}
        </section>
      ) : idea.status === "open" ? (
        <section className="surface mt-10 p-6">
          {showRules ? (
            <>
              <h2 className="text-xl">{t("claim.rulesTitle")}</h2>
              <ul className="prose-body mt-4 list-disc space-y-2.5 pl-5">
                <li>{t("claim.rule1", { days: CLAIM_DAYS })}</li>
                <li>{t("claim.rule2", { extension: CLAIM_EXTENSION_DAYS })}</li>
                <li>{t("claim.rule3")}</li>
                <li>{t("claim.rule4", { max: MAX_ACTIVE_CLAIMS })}</li>
              </ul>
              <div className="mt-5 flex flex-wrap gap-3">
                <button
                  type="button"
                  className="btn btn-primary"
                  disabled={pending}
                  onClick={() => run(() => claimIdea(idea.id), "claim.done")}
                >
                  {pending ? t("common.loading") : t("claim.confirm")}
                </button>
                <button type="button" className="btn btn-ghost" onClick={() => setShowRules(false)}>
                  {t("common.cancel")}
                </button>
              </div>
            </>
          ) : (
            <>
              <h2 className="text-xl">{t("claim.cta")}</h2>
              <p className="prose-body mt-2">{t("claim.rule1", { days: CLAIM_DAYS })}</p>
              <button type="button" className="btn btn-primary mt-4" onClick={() => setShowRules(true)}>
                {t("claim.cta")}
              </button>
            </>
          )}
        </section>
      ) : null}
    </div>
  );
}

"use client";

import Link from "next/link";
import type { IdeaCardModel } from "@/lib/api/ideas";
import { displayName } from "@/lib/api/profiles";
import { useT } from "@/i18n/provider";
import { StatusBadge } from "@/components/status-badge";
import { VoteButton } from "@/components/vote-button";

export function IdeaCard({ card, viewerId }: { card: IdeaCardModel; viewerId: string }) {
  const t = useT();
  const { idea, author } = card;
  const isOwn = idea.author_id === viewerId;

  return (
    <article className="surface flex flex-col gap-4 p-5 transition-colors hover:border-rule-strong sm:flex-row sm:items-start sm:gap-5">
      <div className="order-2 sm:order-1 sm:pt-1">
        <VoteButton
          ideaId={idea.id}
          userId={viewerId}
          count={idea.vote_count}
          hasVoted={card.hasVoted}
          isOwn={isOwn}
        />
      </div>

      <div className="order-1 min-w-0 flex-1 sm:order-2">
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={idea.status} />
          <span className="badge bg-paper-sunk uppercase text-ink-faint">{idea.language}</span>
          {idea.campus ? (
            <span className="badge bg-paper-sunk text-ink-faint">{idea.campus}</span>
          ) : null}
        </div>

        <h2 className="mt-2 text-xl leading-snug">
          <Link href={`/idea/?id=${idea.id}`} className="hover:text-accent-ink">
            {idea.title}
          </Link>
        </h2>

        <p className="prose-body mt-1.5 line-clamp-2 text-sm">{idea.problem}</p>

        <p className="mt-3 text-xs text-ink-faint">
          {t("ideas.byAuthor", { name: displayName(author, "—") })}
          {idea.tags.length > 0 ? ` · ${idea.tags.map((tag) => `#${tag}`).join(" ")}` : ""}
        </p>
      </div>
    </article>
  );
}

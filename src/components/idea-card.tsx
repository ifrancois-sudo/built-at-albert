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
    <article className="surface flex flex-col gap-5 p-6 transition-transform hover:-translate-y-0.5 sm:flex-row sm:items-start sm:gap-7 sm:p-7">
      {/* A printed rule separates the tally from the text, the way a masthead
          separates a folio from a headline. */}
      <div className="order-2 sm:order-1 sm:border-r-2 sm:border-ink sm:pr-7">
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
          <span className="badge text-ink-faint">{idea.language}</span>
          {idea.campus ? <span className="badge text-ink-faint">{idea.campus}</span> : null}
        </div>

        <h2 className="mt-3 text-[1.75rem] leading-[1.12] sm:text-[2rem]">
          <Link href={`/idea/?id=${idea.id}`} className="hover:text-accent">
            {idea.title}
          </Link>
        </h2>

        <p className="prose-body mt-2.5 line-clamp-2">{idea.problem}</p>

        <p className="meta mt-4">
          {t("ideas.byAuthor", { name: displayName(author, "—") })}
          {idea.tags.length > 0 ? ` · ${idea.tags.map((tag) => `#${tag}`).join(" ")}` : ""}
        </p>
      </div>
    </article>
  );
}

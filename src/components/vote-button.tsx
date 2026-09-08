"use client";

import { useOptimistic, useTransition } from "react";
import { toggleVoteAction } from "@/app/actions/ideas";
import { useT } from "@/i18n/provider";

export function VoteButton({
  ideaId,
  count,
  hasVoted,
  isOwn,
}: {
  ideaId: string;
  count: number;
  hasVoted: boolean;
  isOwn: boolean;
}) {
  const t = useT();
  const [, startTransition] = useTransition();

  // Optimistic so the count moves the instant it is clicked; the server action
  // revalidates and the real number lands a moment later.
  const [optimistic, setOptimistic] = useOptimistic(
    { count, hasVoted },
    (state) => ({
      count: state.hasVoted ? state.count - 1 : state.count + 1,
      hasVoted: !state.hasVoted,
    }),
  );

  if (isOwn) {
    return (
      <span className="badge bg-paper-sunk text-ink-faint" title={t("ideas.voteOwn")}>
        {t.plural("ideas.voteCount", "ideas.voteCountPlural", count)}
      </span>
    );
  }

  return (
    <button
      type="button"
      aria-pressed={optimistic.hasVoted}
      className={`btn h-9 min-h-0 px-3 text-sm ${
        optimistic.hasVoted ? "btn-primary" : "btn-secondary"
      }`}
      onClick={() =>
        startTransition(async () => {
          setOptimistic(null);
          await toggleVoteAction(ideaId, optimistic.hasVoted);
        })
      }
    >
      <span aria-hidden>{optimistic.hasVoted ? "▲" : "△"}</span>
      <span>{t.plural("ideas.voteCount", "ideas.voteCountPlural", optimistic.count)}</span>
    </button>
  );
}

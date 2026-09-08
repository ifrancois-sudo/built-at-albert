"use client";

import { useState, useTransition } from "react";
import { toggleVote } from "@/lib/api/ideas";
import { useT } from "@/i18n/provider";

export function VoteButton({
  ideaId,
  userId,
  count,
  hasVoted,
  isOwn,
}: {
  ideaId: string;
  userId: string;
  count: number;
  hasVoted: boolean;
  isOwn: boolean;
}) {
  const t = useT();
  const [state, setState] = useState({ count, hasVoted });
  const [pending, startTransition] = useTransition();

  if (isOwn) {
    return (
      <span className="badge bg-paper-sunk text-ink-faint" title={t("ideas.voteOwn")}>
        {t.plural("ideas.voteCount", "ideas.voteCountPlural", state.count)}
      </span>
    );
  }

  function onClick() {
    // Move the count immediately, then put it back if the write is refused.
    const previous = state;
    const next = { count: state.hasVoted ? state.count - 1 : state.count + 1, hasVoted: !state.hasVoted };
    setState(next);

    startTransition(async () => {
      const { error } = await toggleVote(ideaId, userId, previous.hasVoted);
      if (error) setState(previous);
    });
  }

  return (
    <button
      type="button"
      aria-pressed={state.hasVoted}
      disabled={pending}
      className={`btn h-9 min-h-0 px-3 text-sm ${state.hasVoted ? "btn-primary" : "btn-secondary"}`}
      onClick={onClick}
    >
      <span aria-hidden>{state.hasVoted ? "▲" : "△"}</span>
      <span>{t.plural("ideas.voteCount", "ideas.voteCountPlural", state.count)}</span>
    </button>
  );
}

"use client";

import { useState, useTransition } from "react";
import { toggleVote } from "@/lib/api/ideas";
import { useT } from "@/i18n/provider";

/**
 * The vote is the central gesture of the whole platform, so the count is set as
 * a printed numeral rather than tucked into a chip. Nothing else on a card is
 * this large.
 */
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

  const label = t.plural("ideas.voteCount", "ideas.voteCountPlural", state.count).replace(
    String(state.count),
    "",
  );

  if (isOwn) {
    return (
      <div className="min-w-[96px] text-center" title={t("ideas.voteOwn")}>
        <span className="tally block text-ink-faint">{state.count}</span>
        <span className="meta mt-1 block">{label.trim()}</span>
      </div>
    );
  }

  function onClick() {
    // Move the count immediately, then put it back if the write is refused.
    const previous = state;
    setState({
      count: state.hasVoted ? state.count - 1 : state.count + 1,
      hasVoted: !state.hasVoted,
    });

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
      onClick={onClick}
      className={`group min-w-[96px] rounded-[5px] border-2 px-3 py-2.5 text-center transition-colors ${
        state.hasVoted
          ? "border-accent-strong bg-accent-strong text-white"
          : "border-transparent hover:border-ink-faint"
      } ${pending ? "opacity-60" : ""}`}
    >
      <span className={`tally block ${state.hasVoted ? "text-white" : ""}`}>{state.count}</span>
      <span className={`meta mt-1 block ${state.hasVoted ? "text-white" : ""}`}>
        {state.hasVoted ? t("ideas.voted") : label.trim()}
      </span>
    </button>
  );
}

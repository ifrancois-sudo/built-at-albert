import type { MessageKey } from "@/i18n";

// The definer functions raise bare sentinel strings ('not_admin', 'idea_not_open'…)
// which double as translation keys under `errors.`. Anything unrecognised falls
// back to the generic message rather than leaking Postgres wording to a student.
const KNOWN_CODES = new Set([
  "not_verified",
  "not_admin",
  "idea_not_open",
  "idea_not_found",
  "idea_not_pending",
  "claim_quota_reached",
  "claim_not_releasable",
  "claim_not_extendable",
  "claim_not_deliverable",
  "self_vote_not_allowed",
  "already_claimed",
  "reason_required",
  "cannot_demote_self",
]);

interface MaybePostgrestError {
  code?: string;
  message?: string;
}

export function errorMessageKey(error: unknown): MessageKey {
  const candidate = error as MaybePostgrestError | null;

  // A losing race on the partial unique index means someone else got there first.
  if (candidate?.code === "23505") return "errors.already_claimed";

  const sentinel = candidate?.message?.trim();
  if (sentinel && KNOWN_CODES.has(sentinel)) {
    return `errors.${sentinel}` as MessageKey;
  }

  return "common.genericError";
}

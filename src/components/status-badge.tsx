"use client";

import { useT } from "@/i18n/provider";
import type { IdeaStatus } from "@/lib/database.types";

// Open is the only status that gets a filled badge: it is the one a student can
// act on, and it should be the loudest thing in a row of labels.
const TONE: Record<IdeaStatus, string> = {
  pending: "text-ink-faint",
  open: "badge-solid bg-accent-strong",
  claimed: "text-signal",
  delivered: "badge-solid bg-good",
  rejected: "text-bad",
};

export function StatusBadge({ status }: { status: IdeaStatus }) {
  const t = useT();
  return <span className={`badge ${TONE[status]}`}>{t(`status.${status}`)}</span>;
}

"use client";

import { useT } from "@/i18n/provider";
import type { IdeaStatus } from "@/lib/database.types";

const TONE: Record<IdeaStatus, string> = {
  pending: "bg-paper-sunk text-ink-faint",
  open: "bg-accent-soft text-accent-ink",
  claimed: "bg-signal-soft text-signal",
  delivered: "bg-good-soft text-good",
  rejected: "bg-bad-soft text-bad",
};

export function StatusBadge({ status }: { status: IdeaStatus }) {
  const t = useT();
  return <span className={`badge ${TONE[status]}`}>{t(`status.${status}`)}</span>;
}

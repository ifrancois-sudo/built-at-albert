import type { IdeaStatus } from "@/lib/database.types";
import type { Translator } from "@/i18n";

const TONE: Record<IdeaStatus, string> = {
  pending: "bg-paper-sunk text-ink-faint",
  open: "bg-accent-soft text-accent-ink",
  claimed: "bg-signal-soft text-signal",
  delivered: "bg-good-soft text-good",
  rejected: "bg-bad-soft text-bad",
};

export function StatusBadge({ status, t }: { status: IdeaStatus; t: Translator }) {
  return <span className={`badge ${TONE[status]}`}>{t(`status.${status}`)}</span>;
}

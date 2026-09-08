"use client";

import Link from "next/link";
import { useActionState } from "react";
import { releaseClaimAction } from "@/app/actions/ideas";
import { IDLE_STATE } from "@/lib/action-state";
import { useT } from "@/i18n/provider";

export function ClaimRow({
  claimId,
  ideaId,
  ideaTitle,
  holderName,
  expiresLabel,
}: {
  claimId: string;
  ideaId: string;
  ideaTitle: string;
  holderName: string;
  expiresLabel: string;
}) {
  const t = useT();
  const [, action, pending] = useActionState(releaseClaimAction, IDLE_STATE);

  return (
    <li className="surface flex flex-wrap items-center gap-3 p-4">
      <Link href={`/ideas/${ideaId}`} className="flex-1 hover:text-accent-ink">
        {ideaTitle}
      </Link>
      <span className="text-sm text-ink-faint">
        {holderName} · {t("ideas.claimedUntil", { date: expiresLabel })}
      </span>
      <form action={action}>
        <input type="hidden" name="claim_id" value={claimId} />
        <button type="submit" className="btn btn-danger h-9 min-h-0 px-3 text-sm" disabled={pending}>
          {t("admin.forceRelease")}
        </button>
      </form>
    </li>
  );
}

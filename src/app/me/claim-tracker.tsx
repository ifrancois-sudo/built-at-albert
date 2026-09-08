"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { extendClaimAction, releaseClaimAction } from "@/app/actions/ideas";
import { IDLE_STATE } from "@/lib/action-state";
import { useT } from "@/i18n/provider";
import { FormMessage } from "@/components/form-message";
import { CLAIM_EXTENSION_DAYS } from "@/lib/public-config";
import { daysUntil } from "@/lib/format";
import { DeliveryForm } from "./delivery-form";

export function ClaimTracker({
  claimId,
  ideaId,
  ideaTitle,
  expiresAt,
  expiresLabel,
}: {
  claimId: string;
  ideaId: string;
  ideaTitle: string;
  expiresAt: string;
  expiresLabel: string;
}) {
  const t = useT();
  const [extendState, extendAction, extendPending] = useActionState(extendClaimAction, IDLE_STATE);
  const [releaseState, releaseAction, releasePending] = useActionState(releaseClaimAction, IDLE_STATE);
  const [delivering, setDelivering] = useState(false);

  const left = daysUntil(expiresAt);
  // Under a week left, the countdown switches to the signal colour. That is the
  // only place amber is used, so it reads as a deadline rather than decoration.
  const urgent = left <= 7;

  return (
    <article className="surface p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <Link href={`/ideas/${ideaId}`} className="text-lg hover:text-accent-ink">
            {ideaTitle}
          </Link>
          <p className="mt-1 text-sm text-ink-faint">
            {t("ideas.claimedUntil", { date: expiresLabel })}
          </p>
        </div>
        <span
          className={`badge ${urgent ? "bg-signal-soft text-signal" : "bg-accent-soft text-accent-ink"}`}
        >
          {left === 0
            ? t("claim.expiresToday")
            : t.plural("claim.daysLeft", "claim.daysLeftPlural", left)}
        </span>
      </div>

      {extendState.status !== "idle" && extendState.messageKey ? (
        <div className="mt-4">
          <FormMessage
            tone={extendState.status === "error" ? "error" : "success"}
            messageKey={extendState.messageKey}
            params={extendState.params}
          />
        </div>
      ) : null}
      {releaseState.status !== "idle" && releaseState.messageKey ? (
        <div className="mt-4">
          <FormMessage
            tone={releaseState.status === "error" ? "error" : "success"}
            messageKey={releaseState.messageKey}
          />
        </div>
      ) : null}

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          className="btn btn-primary h-10 min-h-0"
          onClick={() => setDelivering((open) => !open)}
          aria-expanded={delivering}
        >
          {t("claim.deliverCta")}
        </button>

        <form action={extendAction}>
          <input type="hidden" name="claim_id" value={claimId} />
          <button type="submit" className="btn btn-secondary h-10 min-h-0" disabled={extendPending}>
            {t("claim.extend", { extension: CLAIM_EXTENSION_DAYS })}
          </button>
        </form>

        <form action={releaseAction}>
          <input type="hidden" name="claim_id" value={claimId} />
          <button type="submit" className="btn btn-danger h-10 min-h-0" disabled={releasePending}>
            {t("claim.release")}
          </button>
        </form>
      </div>

      {delivering ? <DeliveryForm claimId={claimId} /> : null}
    </article>
  );
}

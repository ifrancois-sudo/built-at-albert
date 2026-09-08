"use client";

import Link from "next/link";
import { useState } from "react";
import { useLocale, useT } from "@/i18n/provider";
import { FormMessage } from "@/components/form-message";
import { DeliveryForm } from "@/app/me/delivery-form";
import { extendClaim, releaseClaim } from "@/lib/api/claims";
import { errorMessageKey } from "@/lib/errors";
import { daysUntil, formatDate } from "@/lib/format";
import { CLAIM_EXTENSION_DAYS } from "@/lib/public-config";
import type { ClaimRow } from "@/lib/database.types";
import type { MessageKey } from "@/i18n";

export function ClaimTracker({
  claim,
  ideaTitle,
  userId,
  onChanged,
}: {
  claim: ClaimRow;
  ideaTitle: string;
  userId: string;
  onChanged: () => Promise<void>;
}) {
  const t = useT();
  const { locale } = useLocale();
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<{ tone: "error" | "success"; key: MessageKey } | null>(null);
  const [delivering, setDelivering] = useState(false);

  const left = daysUntil(claim.expires_at);
  // Under a week left, the countdown turns amber. That is the only place the
  // colour is used, so it reads as a deadline rather than decoration.
  const urgent = left <= 7;

  async function run(action: () => Promise<{ error: unknown }>, successKey: MessageKey) {
    setPending(true);
    setMessage(null);
    const { error } = await action();
    setPending(false);

    if (error) return setMessage({ tone: "error", key: errorMessageKey(error) });
    setMessage({ tone: "success", key: successKey });
    await onChanged();
  }

  return (
    <article className="surface p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <Link href={`/idea/?id=${claim.idea_id}`} className="text-lg hover:text-accent-ink">
            {ideaTitle}
          </Link>
          <p className="mt-1 text-sm text-ink-faint">
            {t("ideas.claimedUntil", { date: formatDate(claim.expires_at, locale) })}
          </p>
        </div>
        <span className={`badge ${urgent ? "bg-signal-soft text-signal" : "bg-accent-soft text-accent-ink"}`}>
          {left === 0 ? t("claim.expiresToday") : t.plural("claim.daysLeft", "claim.daysLeftPlural", left)}
        </span>
      </div>

      {message ? (
        <div className="mt-4">
          <FormMessage tone={message.tone} messageKey={message.key} />
        </div>
      ) : null}

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          className="btn btn-primary h-10 min-h-0"
          aria-expanded={delivering}
          onClick={() => setDelivering((open) => !open)}
        >
          {t("claim.deliverCta")}
        </button>
        <button
          type="button"
          className="btn btn-secondary h-10 min-h-0"
          disabled={pending}
          onClick={() => run(() => extendClaim(claim.id), "claim.extended")}
        >
          {t("claim.extend", { extension: CLAIM_EXTENSION_DAYS })}
        </button>
        <button
          type="button"
          className="btn btn-danger h-10 min-h-0"
          disabled={pending}
          onClick={() => run(() => releaseClaim(claim.id), "claim.released")}
        >
          {t("claim.release")}
        </button>
      </div>

      {delivering ? (
        <DeliveryForm claimId={claim.id} userId={userId} onDelivered={onChanged} />
      ) : null}
    </article>
  );
}

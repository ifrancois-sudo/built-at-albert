"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { claimIdeaAction, releaseClaimAction } from "@/app/actions/ideas";
import { IDLE_STATE } from "@/lib/action-state";
import { useT } from "@/i18n/provider";
import { FormMessage } from "@/components/form-message";
import { CLAIM_DAYS, CLAIM_EXTENSION_DAYS, MAX_ACTIVE_CLAIMS } from "@/lib/public-config";
import type { IdeaStatus } from "@/lib/database.types";

interface ClaimSummary {
  id: string;
  expiresAt: string;
  claimantName: string;
  isMine: boolean;
}

export function ClaimPanel({
  ideaId,
  ideaStatus,
  claim,
  expiresLabel,
}: {
  ideaId: string;
  ideaStatus: IdeaStatus;
  claim: ClaimSummary | null;
  expiresLabel: string;
}) {
  const t = useT();
  const [claimState, claimAction, claimPending] = useActionState(claimIdeaAction, IDLE_STATE);
  const [releaseState, releaseAction, releasePending] = useActionState(releaseClaimAction, IDLE_STATE);
  const [showRules, setShowRules] = useState(false);

  if (claim) {
    return (
      <section className="surface mt-10 p-6">
        <p className="text-sm">
          {t("ideas.claimedBy", { name: claim.claimantName })}{" "}
          <span className="text-ink-faint">{t("ideas.claimedUntil", { date: expiresLabel })}</span>
        </p>

        {claim.isMine ? (
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <Link href="/me" className="btn btn-primary">
              {t("claim.deliverCta")}
            </Link>
            <form action={releaseAction}>
              <input type="hidden" name="claim_id" value={claim.id} />
              <button type="submit" className="btn btn-danger" disabled={releasePending}>
                {t("claim.release")}
              </button>
            </form>
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
      </section>
    );
  }

  if (ideaStatus !== "open") return null;

  return (
    <section className="surface mt-10 p-6">
      {claimState.status !== "idle" && claimState.messageKey ? (
        <div className="mb-4">
          <FormMessage
            tone={claimState.status === "error" ? "error" : "success"}
            messageKey={claimState.messageKey}
          />
        </div>
      ) : null}

      {showRules ? (
        <>
          <h2 className="text-xl">{t("claim.rulesTitle")}</h2>
          <ul className="prose-body mt-3 list-disc space-y-1.5 pl-5 text-sm">
            <li>{t("claim.rule1", { days: CLAIM_DAYS })}</li>
            <li>{t("claim.rule2", { extension: CLAIM_EXTENSION_DAYS })}</li>
            <li>{t("claim.rule3")}</li>
            <li>{t("claim.rule4", { max: MAX_ACTIVE_CLAIMS })}</li>
          </ul>
          <div className="mt-5 flex flex-wrap gap-3">
            <form action={claimAction}>
              <input type="hidden" name="idea_id" value={ideaId} />
              <button type="submit" className="btn btn-primary" disabled={claimPending}>
                {claimPending ? t("common.loading") : t("claim.confirm")}
              </button>
            </form>
            <button type="button" className="btn btn-ghost" onClick={() => setShowRules(false)}>
              {t("common.cancel")}
            </button>
          </div>
        </>
      ) : (
        <>
          <h2 className="text-xl">{t("claim.cta")}</h2>
          <p className="prose-body mt-2 text-sm">{t("claim.rule1", { days: CLAIM_DAYS })}</p>
          <button
            type="button"
            className="btn btn-primary mt-4"
            onClick={() => setShowRules(true)}
          >
            {t("claim.cta")}
          </button>
        </>
      )}
    </section>
  );
}

"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useSession } from "@/lib/session";
import { useT } from "@/i18n/provider";
import { ALLOWED_EMAIL_DOMAINS, CLAIM_DAYS } from "@/lib/public-config";

export default function LandingPage() {
  const t = useT();
  const router = useRouter();
  const { verified } = useSession();

  useEffect(() => {
    if (verified) router.replace("/ideas/");
  }, [verified, router]);

  const steps = [
    { title: t("landing.step1Title"), body: t("landing.step1Body") },
    { title: t("landing.step2Title"), body: t("landing.step2Body") },
    { title: t("landing.step3Title"), body: t("landing.step3Body") },
    { title: t("landing.step4Title"), body: t("landing.step4Body") },
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6">
      <section className="animate-rise grid gap-10 py-16 lg:grid-cols-[1.15fr_0.85fr] lg:items-end lg:py-24">
        <div>
          <p className="badge bg-accent-soft text-accent-ink">{t("landing.eyebrow")}</p>
          <h1 className="mt-5 text-[clamp(2.4rem,6vw,4.25rem)] leading-[1.02]">
            {t("landing.title")}
          </h1>
          <p className="prose-body mt-5 max-w-xl text-lg">{t("landing.subtitle")}</p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link href="/signup/" className="btn btn-primary">
              {t("landing.ctaPrimary")}
            </Link>
            <Link href="/login/" className="btn btn-secondary">
              {t("landing.ctaSecondary")}
            </Link>
          </div>
          <p className="mt-3 text-sm text-ink-faint">
            {t("landing.restricted")} {ALLOWED_EMAIL_DOMAINS.join(", ")}
          </p>
        </div>

        {/* The countdown is the rule that keeps the board from silting up, so it
            is stated on the very first screen rather than buried. */}
        <aside className="surface p-6 lg:mb-2">
          <p className="font-display text-6xl leading-none text-accent">{CLAIM_DAYS}</p>
          <p className="mt-3 text-sm font-semibold">{t("claim.rulesTitle")}</p>
          <ul className="prose-body mt-3 space-y-2 text-sm">
            <li>{t("claim.rule1", { days: CLAIM_DAYS })}</li>
            <li>{t("claim.rule3")}</li>
            <li>{t("claim.rule4")}</li>
          </ul>
        </aside>
      </section>

      <section className="border-t border-rule py-14">
        <ol className="grid gap-px overflow-hidden rounded-[14px] border border-rule bg-rule sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, index) => (
            <li key={step.title} className="bg-paper-raised p-6">
              <span className="font-display text-3xl text-ink-faint">0{index + 1}</span>
              <h2 className="mt-3 text-xl">{step.title}</h2>
              <p className="prose-body mt-2 text-sm">{step.body}</p>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}

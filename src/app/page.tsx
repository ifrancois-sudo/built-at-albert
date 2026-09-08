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
    <div className="mx-auto max-w-6xl px-5 sm:px-8">
      <section className="animate-rise py-16 lg:py-24">
        <p className="kicker">{t("landing.eyebrow")}</p>

        {/* The headline is the whole design. At this size the serif carries the
            energy that a second accent colour would otherwise have to fake. */}
        <h1 className="mt-6 max-w-[19ch] text-[clamp(3rem,9vw,6.5rem)] leading-[0.94]">
          {t("landing.title")}
        </h1>

        <div className="mt-10 grid gap-10 lg:grid-cols-[1.2fr_0.8fr] lg:items-start">
          <div>
            <p className="prose-body max-w-[46ch] text-[1.3125rem] leading-[1.5]">
              {t("landing.subtitle")}
            </p>

            <div className="mt-9 flex flex-wrap items-center gap-4">
              <Link href="/signup/" className="btn btn-primary">
                {t("landing.ctaPrimary")}
              </Link>
              <Link href="/login/" className="btn btn-secondary">
                {t("landing.ctaSecondary")}
              </Link>
            </div>

            <p className="meta mt-5">
              {t("landing.restricted")} {ALLOWED_EMAIL_DOMAINS.join(", ")}
            </p>
          </div>

          {/* The countdown is the rule that keeps the board from silting up, so
              it is stated on the first screen rather than buried in a form. */}
          <aside className="surface p-7">
            <p className="tally text-[4.5rem]">{CLAIM_DAYS}</p>
            <p className="kicker mt-3">{t("claim.rulesTitle")}</p>
            <ul className="prose-body mt-4 space-y-3">
              <li>{t("claim.rule1", { days: CLAIM_DAYS })}</li>
              <li>{t("claim.rule3")}</li>
              <li>{t("claim.rule4")}</li>
            </ul>
          </aside>
        </div>
      </section>

      <hr className="rule-heavy" />

      <section className="py-16">
        <ol className="grid gap-x-10 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, index) => (
            <li key={step.title}>
              <span className="font-display text-[3.5rem] leading-none text-accent">
                0{index + 1}
              </span>
              <h2 className="mt-3 text-[1.75rem] leading-tight">{step.title}</h2>
              <p className="prose-body mt-2">{step.body}</p>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}

"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useSession } from "@/lib/session";
import { useLocale, useT } from "@/i18n/provider";
import { IdeaCard } from "@/components/idea-card";
import { displayName } from "@/lib/api/profiles";
import { loadHome, type HomeSnapshot } from "@/lib/api/home";
import { daysUntil, formatDate } from "@/lib/format";
import { CLAIM_DAYS } from "@/lib/public-config";

/** The page a signed-in student lands on. */
export function Home() {
  const t = useT();
  const { locale } = useLocale();
  const { user, profile } = useSession();
  const viewerId = user?.id ?? "";
  const [data, setData] = useState<HomeSnapshot | null>(null);

  const load = useCallback(() => loadHome(viewerId), [viewerId]);

  useEffect(() => {
    let cancelled = false;
    void load().then((next) => {
      if (!cancelled) setData(next);
    });
    return () => {
      cancelled = true;
    };
  }, [load]);

  if (!data) {
    return <p className="mx-auto max-w-6xl px-5 py-24 text-ink-faint sm:px-8">{t("common.loading")}</p>;
  }

  const firstName = displayName(profile, "").split(" ")[0];

  return (
    <div className="mx-auto max-w-6xl px-5 sm:px-8">
      <section className="animate-rise pt-14 pb-12">
        {firstName ? <p className="kicker">{t("home.greeting", { name: firstName })}</p> : null}
        <h1 className="mt-5 max-w-[16ch] text-[clamp(2.5rem,7vw,5rem)] leading-[0.96]">
          {t("home.title")}
        </h1>

        {/* The three figures are the platform's pulse. Set as printed numerals
            so a glance tells you whether anything is actually happening. */}
        <dl className="mt-12 grid gap-x-10 gap-y-8 border-y-2 border-ink py-8 sm:grid-cols-3">
          {(
            [
              [data.counts.open, t("home.statOpen"), "text-accent"],
              [data.counts.claimed, t("home.statClaimed"), "text-signal"],
              [data.counts.delivered, t("home.statDelivered"), "text-good"],
            ] as const
          ).map(([value, label, tone]) => (
            <div key={label}>
              <dd className={`tally text-[4rem] ${tone}`}>{value}</dd>
              <dt className="meta mt-2">{label}</dt>
            </div>
          ))}
        </dl>
      </section>

      {data.myClaims.length > 0 ? (
        <section className="surface mb-14 p-7">
          <p className="kicker">{t("home.claimsTitle")}</p>
          <p className="prose-body mt-2">{t("home.claimsBody")}</p>

          <ul className="mt-6 flex flex-col gap-4">
            {data.myClaims.map(({ claim, ideaTitle }) => {
              const left = daysUntil(claim.expires_at);
              return (
                <li key={claim.id} className="flex flex-wrap items-baseline gap-x-5 gap-y-2">
                  <span className={`tally text-[2.5rem] ${left <= 7 ? "text-signal" : ""}`}>
                    {left}
                  </span>
                  <span className="meta">
                    {left === 0
                      ? t("claim.expiresToday")
                      : t.plural("claim.daysLeft", "claim.daysLeftPlural", left)}
                  </span>
                  <Link href={`/idea/?id=${claim.idea_id}`} className="text-xl hover:text-accent-ink">
                    {ideaTitle}
                  </Link>
                  <span className="meta">{formatDate(claim.expires_at, locale)}</span>
                </li>
              );
            })}
          </ul>

          <Link href="/me/" className="btn btn-secondary btn-sm mt-6">
            {t("claim.deliverCta")}
          </Link>
        </section>
      ) : null}

      <section className="pb-14">
        <div className="flex flex-wrap items-baseline justify-between gap-4">
          <h2 className="text-[2rem]">{t("home.topTitle")}</h2>
          <Link href="/ideas/" className="meta underline underline-offset-4 hover:text-accent-ink">
            {t("home.topAll", { count: data.counts.open + data.counts.claimed })}
          </Link>
        </div>

        <div className="mt-6 flex flex-col gap-4">
          {data.topIdeas.map((card) => (
            <IdeaCard key={card.idea.id} card={card} viewerId={viewerId} />
          ))}
        </div>
      </section>

      <hr className="rule-heavy" />

      <section className="py-14">
        <div className="flex flex-wrap items-baseline justify-between gap-4">
          <h2 className="text-[2rem]">{t("home.shippedTitle")}</h2>
          {data.latestProjects.length > 0 ? (
            <Link href="/projects/" className="meta underline underline-offset-4 hover:text-accent-ink">
              {t("home.shippedAll")}
            </Link>
          ) : null}
        </div>

        {data.latestProjects.length === 0 ? (
          <p className="prose-body mt-4 max-w-[52ch]">{t("home.shippedEmpty")}</p>
        ) : (
          <ul className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {data.latestProjects.map(({ project, ideaTitle }) => (
              <li key={project.id} className="surface flex flex-col overflow-hidden">
                {project.screenshots[0] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={project.screenshots[0]}
                    alt=""
                    loading="lazy"
                    className="aspect-[16/10] w-full border-b-2 border-ink object-cover"
                  />
                ) : null}
                <div className="flex flex-1 flex-col p-5">
                  <h3 className="text-xl leading-snug">{ideaTitle}</h3>
                  <p className="prose-body mt-2 line-clamp-2 flex-1">{project.description}</p>
                  <a
                    href={project.url}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="btn btn-primary btn-sm mt-4 self-start"
                  >
                    {t("gallery.openTool")}
                  </a>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <hr className="rule-heavy" />

      {/* Both halves of the loop, side by side. A student who only ever votes
          keeps the board alive; a student who builds is what makes it worth
          having. The page should ask for both. */}
      <section className="grid gap-px border-2 border-ink bg-ink sm:grid-cols-2">
        <div className="bg-paper-raised p-7">
          <h2 className="text-[1.75rem] leading-tight">{t("home.ctaTitle")}</h2>
          <p className="prose-body mt-2">{t("home.ctaBody")}</p>
          <Link href="/ideas/new/" className="btn btn-primary mt-5">
            {t("home.ctaButton")}
          </Link>
        </div>
        <div className="bg-paper-raised p-7">
          <h2 className="text-[1.75rem] leading-tight">{t("home.buildTitle")}</h2>
          <p className="prose-body mt-2">{t("home.buildBody", { days: CLAIM_DAYS })}</p>
          <Link href="/ideas/" className="btn btn-secondary mt-5">
            {t("home.buildButton")}
          </Link>
        </div>
      </section>
    </div>
  );
}

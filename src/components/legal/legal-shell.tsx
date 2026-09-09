"use client";

import Link from "next/link";
import { useLocale, useT } from "@/i18n/provider";
import type { Locale } from "@/i18n";

export interface LegalBlock {
  heading: string;
  paragraphs: string[];
  bullets?: string[];
}

export type LegalDocument = Record<Locale, { title: string; updated: string; blocks: LegalBlock[] }>;

/**
 * Shared frame for the two legal pages.
 *
 * Their prose lives beside them rather than in the message dictionary: it is
 * long, it is edited as a whole document in each language, and mixing it into
 * the interface strings would make both harder to review.
 */
export function LegalShell({ document }: { document: LegalDocument }) {
  const t = useT();
  const { locale } = useLocale();
  const content = document[locale];

  return (
    <article className="mx-auto max-w-[68ch] px-5 py-14 sm:px-8">
      <Link href="/" className="meta underline underline-offset-4 hover:text-accent">
        {t("common.back")}
      </Link>

      <h1 className="mt-6 text-[clamp(2.2rem,5vw,3.25rem)] leading-[1.02]">{content.title}</h1>
      <p className="meta mt-4">{content.updated}</p>

      <hr className="rule-heavy my-10" />

      {content.blocks.map((block) => (
        <section key={block.heading} className="mb-10">
          <h2 className="text-[1.6rem] leading-tight">{block.heading}</h2>
          {block.paragraphs.map((paragraph) => (
            <p key={paragraph} className="prose-body mt-3">
              {paragraph}
            </p>
          ))}
          {block.bullets ? (
            <ul className="prose-body mt-3 list-disc space-y-2 pl-5">
              {block.bullets.map((bullet) => (
                <li key={bullet}>{bullet}</li>
              ))}
            </ul>
          ) : null}
        </section>
      ))}
    </article>
  );
}

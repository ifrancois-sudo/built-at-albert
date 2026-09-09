"use client";

import Link from "next/link";
import { useT } from "@/i18n/provider";
import { WHATSAPP_CHANNEL_URL } from "@/lib/public-config";

export function SiteFooter() {
  const t = useT();

  return (
    <footer className="mt-24 border-t-2 border-ink">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-5 py-9 sm:px-8">
        <p className="meta">
          {t("common.appName")} — {t("common.tagline")}
        </p>
        <nav className="flex flex-wrap items-center gap-x-6 gap-y-2">
          <Link
            href="/mentions-legales/"
            className="meta underline underline-offset-4 hover:text-accent-ink"
          >
            {t("common.legalNotice")}
          </Link>
          <Link
            href="/confidentialite/"
            className="meta underline underline-offset-4 hover:text-accent-ink"
          >
            {t("common.privacy")}
          </Link>
        <a
          href={WHATSAPP_CHANNEL_URL}
          target="_blank"
          rel="noreferrer noopener"
          className="meta underline underline-offset-4 hover:text-accent-ink"
        >
          {t("nav.whatsapp")}
        </a>
        </nav>
      </div>
    </footer>
  );
}

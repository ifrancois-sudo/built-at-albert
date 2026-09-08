"use client";

import { useT } from "@/i18n/provider";
import { WHATSAPP_CHANNEL_URL } from "@/lib/public-config";

export function SiteFooter() {
  const t = useT();

  return (
    <footer className="mt-20 border-t border-rule">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-8 text-sm text-ink-faint sm:px-6">
        <p>
          {t("common.appName")} — {t("common.tagline")}
        </p>
        <a
          href={WHATSAPP_CHANNEL_URL}
          target="_blank"
          rel="noreferrer noopener"
          className="underline underline-offset-4 hover:text-ink"
        >
          {t("nav.whatsapp")}
        </a>
      </div>
    </footer>
  );
}

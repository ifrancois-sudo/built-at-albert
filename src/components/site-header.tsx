"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { useSession } from "@/lib/session";
import { useLocale, useT } from "@/i18n/provider";
import { LOCALES, type Locale } from "@/i18n";
import { WHATSAPP_CHANNEL_URL } from "@/lib/public-config";

export function SiteHeader() {
  const t = useT();
  const { locale, setLocale } = useLocale();
  const { verified, isAdmin } = useSession();
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);

  async function signOut() {
    setSigningOut(true);
    await supabase().auth.signOut();
    router.replace("/");
    setSigningOut(false);
  }

  return (
    <header className="sticky top-0 z-40 border-b border-rule bg-paper/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-3 px-4 py-3 sm:px-6">
        <Link href={verified ? "/ideas/" : "/"} className="font-display text-lg leading-none">
          Built <span className="text-accent">at</span> Albert
        </Link>

        {verified ? (
          <nav aria-label={t("nav.ideas")} className="flex items-center gap-1 text-sm">
            <Link href="/ideas/" className="btn btn-ghost h-9 min-h-0 px-2.5">
              {t("nav.ideas")}
            </Link>
            <Link href="/projects/" className="btn btn-ghost h-9 min-h-0 px-2.5">
              {t("nav.projects")}
            </Link>
            <Link href="/me/" className="btn btn-ghost h-9 min-h-0 px-2.5">
              {t("nav.mySpace")}
            </Link>
            {isAdmin ? (
              <Link href="/admin/" className="btn btn-ghost h-9 min-h-0 px-2.5 text-accent-ink">
                {t("nav.admin")}
              </Link>
            ) : null}
          </nav>
        ) : null}

        <div className="ml-auto flex items-center gap-2">
          {verified ? (
            <a
              href={WHATSAPP_CHANNEL_URL}
              target="_blank"
              rel="noreferrer noopener"
              className="btn btn-secondary hidden h-9 min-h-0 px-2.5 text-sm sm:inline-flex"
            >
              {t("nav.whatsapp")}
            </a>
          ) : null}

          <label className="inline-flex items-center gap-2 text-sm text-ink-faint">
            <span className="sr-only">{t("common.language")}</span>
            <select
              className="input h-9 min-h-0 w-auto py-1 pr-7 text-sm"
              value={locale}
              onChange={(event) => setLocale(event.target.value as Locale)}
            >
              {LOCALES.map((value) => (
                <option key={value} value={value}>
                  {value.toUpperCase()}
                </option>
              ))}
            </select>
          </label>

          {verified ? (
            <button
              type="button"
              className="btn btn-ghost h-9 min-h-0 px-2 text-sm"
              onClick={signOut}
              disabled={signingOut}
            >
              {t("common.signOut")}
            </button>
          ) : (
            <>
              <Link href="/login/" className="btn btn-ghost h-9 min-h-0 px-2.5 text-sm">
                {t("nav.login")}
              </Link>
              <Link href="/signup/" className="btn btn-primary h-9 min-h-0 px-3 text-sm">
                {t("nav.signup")}
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

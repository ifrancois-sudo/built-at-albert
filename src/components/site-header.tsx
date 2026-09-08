import Link from "next/link";
import { getViewer } from "@/lib/auth";
import { getLocale } from "@/i18n/server";
import { createTranslator } from "@/i18n";
import { WHATSAPP_CHANNEL_URL } from "@/lib/public-config";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { SignOutButton } from "@/components/sign-out-button";

export async function SiteHeader() {
  const [locale, viewer] = await Promise.all([getLocale(), getViewer()]);
  const t = createTranslator(locale);

  return (
    <header className="sticky top-0 z-40 border-b border-rule bg-paper/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-3 px-4 py-3 sm:px-6">
        <Link href={viewer ? "/ideas" : "/"} className="font-display text-lg leading-none">
          Built <span className="text-accent">at</span> Albert
        </Link>

        {viewer ? (
          <nav aria-label={t("nav.ideas")} className="flex items-center gap-1 text-sm">
            <Link href="/ideas" className="btn btn-ghost h-9 min-h-0 px-2.5">
              {t("nav.ideas")}
            </Link>
            <Link href="/projects" className="btn btn-ghost h-9 min-h-0 px-2.5">
              {t("nav.projects")}
            </Link>
            <Link href="/me" className="btn btn-ghost h-9 min-h-0 px-2.5">
              {t("nav.mySpace")}
            </Link>
            {viewer.isAdmin ? (
              <Link href="/admin" className="btn btn-ghost h-9 min-h-0 px-2.5 text-accent-ink">
                {t("nav.admin")}
              </Link>
            ) : null}
          </nav>
        ) : null}

        <div className="ml-auto flex items-center gap-2">
          {viewer ? (
            <a
              href={WHATSAPP_CHANNEL_URL}
              target="_blank"
              rel="noreferrer noopener"
              className="btn btn-secondary hidden h-9 min-h-0 px-2.5 text-sm sm:inline-flex"
            >
              {t("nav.whatsapp")}
            </a>
          ) : null}
          <LocaleSwitcher current={locale} />
          {viewer ? (
            <SignOutButton />
          ) : (
            <>
              <Link href="/login" className="btn btn-ghost h-9 min-h-0 px-2.5 text-sm">
                {t("nav.login")}
              </Link>
              <Link href="/signup" className="btn btn-primary h-9 min-h-0 px-3 text-sm">
                {t("nav.signup")}
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

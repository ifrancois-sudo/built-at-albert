"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { LOCALES, type Locale } from "@/i18n";
import { useT } from "@/i18n/provider";
import { setLocale } from "@/app/actions/locale";

export function LocaleSwitcher({ current }: { current: Locale }) {
  const t = useT();
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <label className="inline-flex items-center gap-2 text-sm text-ink-faint">
      <span className="sr-only">{t("common.language")}</span>
      <select
        className="input h-9 min-h-0 w-auto py-1 pr-7 text-sm"
        value={current}
        disabled={pending}
        onChange={(event) => {
          const next = event.target.value as Locale;
          startTransition(async () => {
            await setLocale(next);
            router.refresh();
          });
        }}
      >
        {LOCALES.map((locale) => (
          <option key={locale} value={locale}>
            {locale.toUpperCase()}
          </option>
        ))}
      </select>
    </label>
  );
}

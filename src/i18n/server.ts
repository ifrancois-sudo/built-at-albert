import { cookies, headers } from "next/headers";
import {
  DEFAULT_LOCALE,
  LOCALE_COOKIE,
  createTranslator,
  isLocale,
  localeFromHeader,
  type Locale,
} from "@/i18n";

// Order of precedence: explicit choice stored in a cookie, then the browser's
// preference. The signed-in profile's locale is written to the same cookie at
// sign-in, so it does not need a separate lookup on every render.
export async function getLocale(): Promise<Locale> {
  const cookieStore = await cookies();
  const stored = cookieStore.get(LOCALE_COOKIE)?.value;
  if (isLocale(stored)) return stored;

  const headerStore = await headers();
  return localeFromHeader(headerStore.get("accept-language")) ?? DEFAULT_LOCALE;
}

export async function getTranslator() {
  return createTranslator(await getLocale());
}

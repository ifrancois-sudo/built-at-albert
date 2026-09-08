import fr from "./fr.json";
import en from "./en.json";

export const LOCALES = ["fr", "en"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "fr";
export const LOCALE_STORAGE_KEY = "bata_locale";

const DICTIONARIES = { fr, en } as const;
export type Dictionary = typeof fr;

// Dotted key paths, so a typo in a translation key fails the build rather than
// rendering the raw key to a student.
type PathsOf<T> = T extends Record<string, unknown>
  ? {
      [K in keyof T & string]: T[K] extends Record<string, unknown>
        ? `${K}.${PathsOf<T[K]>}`
        : K;
    }[keyof T & string]
  : never;

export type MessageKey = PathsOf<Dictionary>;

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (LOCALES as readonly string[]).includes(value);
}

export function getDictionary(locale: Locale): Dictionary {
  return DICTIONARIES[locale];
}

function lookup(dictionary: Dictionary, key: string): string | null {
  let node: unknown = dictionary;
  for (const segment of key.split(".")) {
    if (typeof node !== "object" || node === null) return null;
    node = (node as Record<string, unknown>)[segment];
  }
  return typeof node === "string" ? node : null;
}

export type TranslateParams = Record<string, string | number>;

export function translate(
  dictionary: Dictionary,
  key: MessageKey,
  params?: TranslateParams,
): string {
  const template = lookup(dictionary, key) ?? key;
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (match, name: string) =>
    name in params ? String(params[name]) : match,
  );
}

export type Translator = ReturnType<typeof createTranslator>;

export function createTranslator(locale: Locale) {
  const dictionary = getDictionary(locale);
  const t = (key: MessageKey, params?: TranslateParams) => translate(dictionary, key, params);

  // French and English both use the "one vs other" split, so a single plural
  // form covers every string we have.
  t.plural = (
    singular: MessageKey,
    plural: MessageKey,
    count: number,
    params?: TranslateParams,
  ) => translate(dictionary, count === 1 ? singular : plural, { count, ...params });

  t.locale = locale;
  return t;
}

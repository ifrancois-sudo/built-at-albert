"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import {
  DEFAULT_LOCALE,
  LOCALE_STORAGE_KEY,
  createTranslator,
  isLocale,
  type Locale,
  type Translator,
} from "@/i18n";
import { supabase } from "@/lib/supabase/client";

interface LocaleValue {
  t: Translator;
  locale: Locale;
  setLocale: (locale: Locale) => void;
}

const LocaleContext = createContext<LocaleValue | null>(null);

function detect(): Locale {
  if (typeof window === "undefined") return DEFAULT_LOCALE;

  try {
    const stored = window.localStorage.getItem(LOCALE_STORAGE_KEY);
    if (isLocale(stored)) return stored;
  } catch {
    // Private browsing can refuse storage entirely.
  }

  const base = window.navigator.language?.split("-")[0];
  return isLocale(base) ? base : DEFAULT_LOCALE;
}

// The chosen locale is browser state, not React state: it is read from storage
// and shared by every component. Modelling it as an external store lets the
// prerendered HTML keep the default while the browser's real choice arrives on
// the first client render, with no hydration mismatch and no effect.
let current: Locale | null = null;
const listeners = new Set<() => void>();

function getSnapshot(): Locale {
  current ??= detect();
  return current;
}

function getServerSnapshot(): Locale {
  return DEFAULT_LOCALE;
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function publish(next: Locale): void {
  current = next;
  for (const listener of listeners) listener();
}

export function LocaleProvider({ children }: { children: ReactNode }) {
  const locale = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const setLocale = useCallback((next: Locale) => {
    publish(next);

    try {
      window.localStorage.setItem(LOCALE_STORAGE_KEY, next);
    } catch {
      // Nothing to do: the choice simply will not survive a reload.
    }

    // Stored on the profile too, because the weekly digest is written by a Pages
    // Function that has no access to this browser's storage.
    void supabase()
      .auth.getUser()
      .then(({ data }) => {
        if (data.user) supabase().from("profiles").update({ locale: next }).eq("id", data.user.id);
      });
  }, []);

  const value = useMemo<LocaleValue>(
    () => ({ t: createTranslator(locale), locale, setLocale }),
    [locale, setLocale],
  );

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

function useLocaleValue(): LocaleValue {
  const value = useContext(LocaleContext);
  if (!value) throw new Error("useT must be used inside a LocaleProvider");
  return value;
}

export function useT(): Translator {
  return useLocaleValue().t;
}

export function useLocale() {
  const { locale, setLocale } = useLocaleValue();
  return { locale, setLocale };
}

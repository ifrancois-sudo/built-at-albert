"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import { createTranslator, type Locale, type Translator } from "@/i18n";

const LocaleContext = createContext<Translator | null>(null);

export function LocaleProvider({ locale, children }: { locale: Locale; children: ReactNode }) {
  const translator = useMemo(() => createTranslator(locale), [locale]);
  return <LocaleContext.Provider value={translator}>{children}</LocaleContext.Provider>;
}

export function useT(): Translator {
  const translator = useContext(LocaleContext);
  if (!translator) throw new Error("useT must be used inside a LocaleProvider");
  return translator;
}

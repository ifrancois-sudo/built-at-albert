"use client";

import { useT } from "@/i18n/provider";
import type { MessageKey } from "@/i18n";

export function FormMessage({
  tone,
  messageKey,
  params,
}: {
  tone: "error" | "success";
  messageKey: MessageKey;
  params?: Record<string, string | number>;
}) {
  const t = useT();
  const style =
    tone === "error"
      ? "border-bad/25 bg-bad-soft text-bad"
      : "border-good/25 bg-good-soft text-good";

  return (
    <p
      role={tone === "error" ? "alert" : "status"}
      className={`rounded-lg border px-3 py-2 text-sm ${style}`}
    >
      {t(messageKey, params)}
    </p>
  );
}

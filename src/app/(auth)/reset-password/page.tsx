"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { supabase } from "@/lib/supabase/client";
import { useT } from "@/i18n/provider";
import { FormMessage } from "@/components/form-message";
import type { MessageKey } from "@/i18n";

export default function ResetPasswordPage() {
  const t = useT();
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<MessageKey | null>(null);
  const [done, setDone] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const password = String(new FormData(event.currentTarget).get("password") ?? "");

    if (password.length < 12) {
      setError("auth.errorPasswordShort");
      return;
    }

    setPending(true);
    setError(null);

    // The recovery link already established a session through /auth/callback,
    // so this call is authenticated as the account being recovered.
    const { error: updateError } = await supabase().auth.updateUser({ password });

    if (updateError) {
      setError("common.genericError");
      setPending(false);
      return;
    }

    setDone(true);
    router.replace("/ideas/");
  }

  return (
    <div className="animate-rise">
      <h1 className="text-3xl">{t("auth.resetTitle")}</h1>

      {done ? (
        <div className="mt-6">
          <FormMessage tone="success" messageKey="auth.resetDone" />
        </div>
      ) : (
        <form onSubmit={onSubmit} className="mt-6 flex flex-col gap-4">
          {error ? <FormMessage tone="error" messageKey={error} /> : null}
          <div>
            <label className="field-label" htmlFor="password">
              {t("auth.passwordLabel")}
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              minLength={12}
              autoComplete="new-password"
              className="input"
            />
            <p className="field-hint">{t("auth.passwordHint")}</p>
          </div>
          <button type="submit" className="btn btn-primary" disabled={pending}>
            {pending ? t("common.loading") : t("auth.resetSubmit")}
          </button>
        </form>
      )}
    </div>
  );
}

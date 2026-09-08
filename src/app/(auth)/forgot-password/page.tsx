"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { supabase } from "@/lib/supabase/client";
import { useT } from "@/i18n/provider";
import { FormMessage } from "@/components/form-message";
import { isAllowedEmail } from "@/lib/public-config";

export default function ForgotPasswordPage() {
  const t = useT();
  const [pending, setPending] = useState(false);
  const [done, setDone] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);

    const email = String(new FormData(event.currentTarget).get("email") ?? "")
      .trim()
      .toLowerCase();

    if (isAllowedEmail(email)) {
      await supabase().auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback/?next=/reset-password/`,
      });
    }

    // Always the same answer, so the form cannot be used to find out which
    // addresses have an account.
    setDone(true);
    setPending(false);
  }

  return (
    <div className="animate-rise">
      <h1 className="text-3xl">{t("auth.forgotTitle")}</h1>
      <p className="prose-body mt-2 text-sm">{t("auth.forgotBody")}</p>

      {done ? (
        <div className="mt-6">
          <FormMessage tone="success" messageKey="auth.forgotDone" />
        </div>
      ) : (
        <form onSubmit={onSubmit} className="mt-6 flex flex-col gap-4">
          <div>
            <label className="field-label" htmlFor="email">
              {t("auth.emailLabel")}
            </label>
            <input id="email" name="email" type="email" required autoComplete="email" className="input" />
          </div>
          <button type="submit" className="btn btn-primary" disabled={pending}>
            {pending ? t("common.loading") : t("auth.forgotSubmit")}
          </button>
        </form>
      )}

      <p className="mt-6 text-sm">
        <Link href="/login/" className="text-ink-faint underline underline-offset-4 hover:text-ink">
          {t("common.back")}
        </Link>
      </p>
    </div>
  );
}

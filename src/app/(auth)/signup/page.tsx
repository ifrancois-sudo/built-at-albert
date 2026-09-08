"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { supabase } from "@/lib/supabase/client";
import { useT } from "@/i18n/provider";
import { FormMessage } from "@/components/form-message";
import { ALLOWED_EMAIL_DOMAINS, isAllowedEmail } from "@/lib/public-config";
import type { MessageKey } from "@/i18n";

const MIN_PASSWORD_LENGTH = 12;

export default function SignUpPage() {
  const t = useT();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<MessageKey | null>(null);
  const [done, setDone] = useState(false);

  const domains = ALLOWED_EMAIL_DOMAINS.join(", ");

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "").trim().toLowerCase();
    const password = String(form.get("password") ?? "");

    // First gate, for a readable message. The trigger on auth.users is the one
    // that cannot be bypassed, and it refuses the insert whatever the client does.
    if (!isAllowedEmail(email)) {
      setError("auth.errorDomain");
      return;
    }
    if (password.length < MIN_PASSWORD_LENGTH) {
      setError("auth.errorPasswordShort");
      return;
    }

    setPending(true);
    setError(null);

    const { error: signUpError } = await supabase().auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: String(form.get("full_name") ?? "").trim(),
          promo: String(form.get("promo") ?? "").trim(),
          campus: String(form.get("campus") ?? "").trim(),
        },
        emailRedirectTo: `${window.location.origin}/auth/callback/?next=/ideas/`,
      },
    });

    if (signUpError) {
      const message = signUpError.message.toLowerCase();
      if (message.includes("already registered")) setError("auth.errorEmailTaken");
      else if (message.includes("email_domain_not_allowed")) setError("auth.errorDomain");
      else setError("common.genericError");
      setPending(false);
      return;
    }

    setDone(true);
  }

  return (
    <div className="animate-rise">
      <h1 className="text-3xl">{t("auth.signupTitle")}</h1>
      <p className="prose-body mt-2 text-sm">{t("auth.emailHint", { domains })}</p>

      {done ? (
        <div className="mt-6">
          <FormMessage tone="success" messageKey="auth.signupDone" />
        </div>
      ) : (
        <form onSubmit={onSubmit} className="mt-6 flex flex-col gap-4">
          {error ? <FormMessage tone="error" messageKey={error} params={{ domains }} /> : null}

          <div>
            <label className="field-label" htmlFor="full_name">
              {t("auth.fullNameLabel")}
            </label>
            <input id="full_name" name="full_name" required autoComplete="name" className="input" />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="field-label" htmlFor="promo">
                {t("auth.promoLabel")}
              </label>
              <input id="promo" name="promo" className="input" placeholder="B3, M1…" />
            </div>
            <div>
              <label className="field-label" htmlFor="campus">
                {t("auth.campusLabel")}
              </label>
              <input id="campus" name="campus" className="input" placeholder="Paris, Lyon…" />
            </div>
          </div>

          <div>
            <label className="field-label" htmlFor="email">
              {t("auth.emailLabel")}
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              className="input"
              placeholder={`prenom.nom@${ALLOWED_EMAIL_DOMAINS[0]}`}
            />
          </div>

          <div>
            <label className="field-label" htmlFor="password">
              {t("auth.passwordLabel")}
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              minLength={MIN_PASSWORD_LENGTH}
              autoComplete="new-password"
              className="input"
            />
            <p className="field-hint">{t("auth.passwordHint")}</p>
          </div>

          <button type="submit" className="btn btn-primary" disabled={pending}>
            {pending ? t("common.loading") : t("auth.signupSubmit")}
          </button>
        </form>
      )}

      <p className="mt-6 text-sm text-ink-faint">
        {t("auth.signupHasAccount")}{" "}
        <Link href="/login/" className="text-accent-ink underline underline-offset-4">
          {t("nav.login")}
        </Link>
      </p>
    </div>
  );
}

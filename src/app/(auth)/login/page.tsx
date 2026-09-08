"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { supabase } from "@/lib/supabase/client";
import { useSession } from "@/lib/session";
import { useT } from "@/i18n/provider";
import { FormMessage } from "@/components/form-message";
import type { MessageKey } from "@/i18n";

export default function LoginPage() {
  const t = useT();
  const router = useRouter();
  const { verified } = useSession();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<MessageKey | null>(null);

  useEffect(() => {
    if (verified) router.replace("/ideas/");
  }, [verified, router]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);

    const form = new FormData(event.currentTarget);
    const { error: signInError } = await supabase().auth.signInWithPassword({
      email: String(form.get("email") ?? "").trim().toLowerCase(),
      password: String(form.get("password") ?? ""),
    });

    if (signInError) {
      setError("auth.errorCredentials");
      setPending(false);
      return;
    }

    const next = new URLSearchParams(window.location.search).get("next");
    router.replace(next && next.startsWith("/") ? next : "/ideas/");
  }

  return (
    <div className="animate-rise">
      <h1 className="text-3xl">{t("auth.loginTitle")}</h1>

      <form onSubmit={onSubmit} className="mt-6 flex flex-col gap-4">
        {error ? <FormMessage tone="error" messageKey={error} /> : null}

        <div>
          <label className="field-label" htmlFor="email">
            {t("auth.emailLabel")}
          </label>
          <input id="email" name="email" type="email" autoComplete="email" required className="input" />
        </div>

        <div>
          <label className="field-label" htmlFor="password">
            {t("auth.passwordLabel")}
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            className="input"
          />
        </div>

        <button type="submit" className="btn btn-primary" disabled={pending}>
          {pending ? t("common.loading") : t("auth.loginSubmit")}
        </button>
      </form>

      <div className="mt-6 flex flex-col gap-2 text-sm text-ink-faint">
        <p>
          {t("auth.loginNoAccount")}{" "}
          <Link href="/signup/" className="text-accent-ink underline underline-offset-4">
            {t("nav.signup")}
          </Link>
        </p>
        <Link href="/forgot-password/" className="underline underline-offset-4 hover:text-ink">
          {t("auth.loginForgot")}
        </Link>
      </div>
    </div>
  );
}

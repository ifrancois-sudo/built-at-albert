"use client";

import { useActionState } from "react";
import { IDLE_AUTH_STATE, signUpAction } from "@/app/actions/auth";
import { useT } from "@/i18n/provider";
import { FormMessage } from "@/components/form-message";

export function SignUpForm({ domains }: { domains: string }) {
  const t = useT();
  const [state, action, pending] = useActionState(signUpAction, IDLE_AUTH_STATE);

  if (state.status === "success" && state.messageKey) {
    return (
      <div className="mt-6">
        <FormMessage tone="success" messageKey={state.messageKey} />
      </div>
    );
  }

  return (
    <form action={action} className="mt-6 flex flex-col gap-4">
      {state.status === "error" && state.messageKey ? (
        <FormMessage tone="error" messageKey={state.messageKey} params={state.params} />
      ) : null}

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
          placeholder={`prenom.nom@${domains.split(",")[0]?.trim()}`}
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
          minLength={12}
          autoComplete="new-password"
          className="input"
        />
        <p className="field-hint">{t("auth.passwordHint")}</p>
      </div>

      <button type="submit" className="btn btn-primary" disabled={pending}>
        {pending ? t("common.loading") : t("auth.signupSubmit")}
      </button>
    </form>
  );
}

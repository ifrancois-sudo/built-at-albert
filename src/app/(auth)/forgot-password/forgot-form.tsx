"use client";

import { useActionState } from "react";
import { requestPasswordResetAction } from "@/app/actions/auth";
import { IDLE_STATE } from "@/lib/action-state";
import { useT } from "@/i18n/provider";
import { FormMessage } from "@/components/form-message";

export function ForgotForm() {
  const t = useT();
  const [state, action, pending] = useActionState(requestPasswordResetAction, IDLE_STATE);

  if (state.status === "success" && state.messageKey) {
    return (
      <div className="mt-6">
        <FormMessage tone="success" messageKey={state.messageKey} />
      </div>
    );
  }

  return (
    <form action={action} className="mt-6 flex flex-col gap-4">
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
  );
}

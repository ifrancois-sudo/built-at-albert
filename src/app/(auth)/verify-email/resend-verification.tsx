"use client";

import { useActionState } from "react";
import { IDLE_AUTH_STATE, resendVerificationAction, type AuthFormState } from "@/app/actions/auth";
import { useT } from "@/i18n/provider";
import { FormMessage } from "@/components/form-message";

async function resend(): Promise<AuthFormState> {
  return resendVerificationAction();
}

export function ResendVerification() {
  const t = useT();
  const [state, action, pending] = useActionState(resend, IDLE_AUTH_STATE);

  return (
    <form action={action} className="mt-6 flex flex-col gap-4">
      {state.status !== "idle" && state.messageKey ? (
        <FormMessage
          tone={state.status === "error" ? "error" : "success"}
          messageKey={state.messageKey}
        />
      ) : null}
      <button type="submit" className="btn btn-secondary self-start" disabled={pending}>
        {pending ? t("common.loading") : t("auth.verifyResend")}
      </button>
    </form>
  );
}

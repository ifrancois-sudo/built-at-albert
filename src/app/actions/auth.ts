"use server";

import { headers } from "next/headers";
import { createServerSupabase } from "@/lib/supabase/server";
import { allowedEmailDomains, isAllowedEmail } from "@/lib/env";
import type { MessageKey } from "@/i18n";

export interface AuthFormState {
  status: "idle" | "error" | "success";
  messageKey?: MessageKey;
  params?: Record<string, string>;
}

export const IDLE_AUTH_STATE: AuthFormState = { status: "idle" };

const MIN_PASSWORD_LENGTH = 12;

// Absolute URLs for the email links. Reading the request host keeps preview
// deployments working without a per-environment rebuild.
async function siteOrigin(): Promise<string> {
  const headerStore = await headers();
  const host = headerStore.get("x-forwarded-host") ?? headerStore.get("host");
  const proto = headerStore.get("x-forwarded-proto") ?? (host?.startsWith("localhost") ? "http" : "https");
  if (host) return `${proto}://${host}`;
  return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
}

export async function signUpAction(
  _previous: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const fullName = String(formData.get("full_name") ?? "").trim();
  const promo = String(formData.get("promo") ?? "").trim();
  const campus = String(formData.get("campus") ?? "").trim();

  // First gate. The auth.users trigger is the one that cannot be bypassed;
  // this one exists to give a readable message.
  if (!isAllowedEmail(email)) {
    return {
      status: "error",
      messageKey: "auth.errorDomain",
      params: { domains: allowedEmailDomains().join(", ") },
    };
  }

  if (password.length < MIN_PASSWORD_LENGTH) {
    return { status: "error", messageKey: "auth.errorPasswordShort" };
  }

  const supabase = await createServerSupabase();
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName, promo, campus },
      emailRedirectTo: `${await siteOrigin()}/auth/callback?next=/ideas`,
    },
  });

  if (error) {
    if (error.message.toLowerCase().includes("already registered")) {
      return { status: "error", messageKey: "auth.errorEmailTaken" };
    }
    if (error.message.includes("email_domain_not_allowed")) {
      return {
        status: "error",
        messageKey: "auth.errorDomain",
        params: { domains: allowedEmailDomains().join(", ") },
      };
    }
    return { status: "error", messageKey: "common.genericError" };
  }

  return { status: "success", messageKey: "auth.signupDone" };
}

export async function requestPasswordResetAction(
  _previous: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();

  if (isAllowedEmail(email)) {
    const supabase = await createServerSupabase();
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${await siteOrigin()}/auth/callback?next=/reset-password`,
    });
  }

  // Always the same answer, so the form cannot be used to test which addresses
  // have an account.
  return { status: "success", messageKey: "auth.forgotDone" };
}

export async function resendVerificationAction(): Promise<AuthFormState> {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) return { status: "error", messageKey: "common.genericError" };

  await supabase.auth.resend({
    type: "signup",
    email: user.email,
    options: { emailRedirectTo: `${await siteOrigin()}/auth/callback?next=/ideas` },
  });

  return { status: "success", messageKey: "auth.verifyResent" };
}

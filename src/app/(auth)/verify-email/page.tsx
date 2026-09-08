"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { useSession } from "@/lib/session";
import { useT } from "@/i18n/provider";
import { FormMessage } from "@/components/form-message";

export default function VerifyEmailPage() {
  const t = useT();
  const router = useRouter();
  const { loading, user, verified } = useSession();
  const [pending, setPending] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!user) router.replace("/login/");
    else if (verified) router.replace("/ideas/");
  }, [loading, user, verified, router]);

  async function resend() {
    if (!user?.email) return;
    setPending(true);
    await supabase().auth.resend({
      type: "signup",
      email: user.email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback/?next=/ideas/` },
    });
    setSent(true);
    setPending(false);
  }

  if (loading || !user) {
    return <p className="text-ink-faint">{t("common.loading")}</p>;
  }

  return (
    <div className="animate-rise">
      <h1 className="text-3xl">{t("auth.verifyTitle")}</h1>
      <p className="prose-body mt-3">{t("auth.verifyBody", { email: user.email ?? "" })}</p>

      {sent ? (
        <div className="mt-6">
          <FormMessage tone="success" messageKey="auth.verifyResent" />
        </div>
      ) : (
        <button
          type="button"
          className="btn btn-secondary mt-6"
          onClick={resend}
          disabled={pending}
        >
          {pending ? t("common.loading") : t("auth.verifyResend")}
        </button>
      )}
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { EmailOtpType } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase/client";
import { useT } from "@/i18n/provider";

// Landing point for every link Supabase emails out. It handles both shapes the
// service can send: the PKCE `code` when the link is opened in the browser that
// started the flow, and `token_hash` from templates written for server-side
// auth, so a link opened on a phone after signing up on a laptop still works.
export default function AuthCallbackPage() {
  const t = useT();
  const router = useRouter();
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    async function run() {
      const params = new URLSearchParams(window.location.search);
      const rawNext = params.get("next") ?? "/ideas/";
      // Same-site paths only, so the callback cannot become an open redirect.
      const next = rawNext.startsWith("/") && !rawNext.startsWith("//") ? rawNext : "/ideas/";

      const code = params.get("code");
      const tokenHash = params.get("token_hash");
      const type = params.get("type") as EmailOtpType | null;

      if (tokenHash && type) {
        const { error } = await supabase().auth.verifyOtp({ type, token_hash: tokenHash });
        if (!error) return router.replace(next);
      } else if (code) {
        const { error } = await supabase().auth.exchangeCodeForSession(code);
        if (!error) return router.replace(next);
      }

      setFailed(true);
    }

    void run();
  }, [router]);

  return (
    <div className="mx-auto max-w-md px-4 py-20 sm:px-0">
      <p className="text-ink-faint">
        {failed ? t("common.genericError") : t("common.loading")}
      </p>
      {failed ? (
        <a href="/login/" className="btn btn-secondary mt-4">
          {t("nav.login")}
        </a>
      ) : null}
    </div>
  );
}

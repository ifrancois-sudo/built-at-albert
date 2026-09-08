import type { Metadata } from "next";
import Link from "next/link";
import { getTranslator } from "@/i18n/server";
import { allowedEmailDomains } from "@/lib/env";
import { SignUpForm } from "./signup-form";

export const metadata: Metadata = { title: "Créer un compte" };

export default async function SignUpPage() {
  const t = await getTranslator();

  return (
    <div className="animate-rise">
      <h1 className="text-3xl">{t("auth.signupTitle")}</h1>
      <p className="prose-body mt-2 text-sm">
        {t("auth.emailHint", { domains: allowedEmailDomains().join(", ") })}
      </p>
      <SignUpForm domains={allowedEmailDomains().join(", ")} />
      <p className="mt-6 text-sm text-ink-faint">
        {t("auth.signupHasAccount")}{" "}
        <Link href="/login" className="text-accent-ink underline underline-offset-4">
          {t("nav.login")}
        </Link>
      </p>
    </div>
  );
}

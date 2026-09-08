import type { Metadata } from "next";
import Link from "next/link";
import { getTranslator } from "@/i18n/server";
import { ForgotForm } from "./forgot-form";

export const metadata: Metadata = { title: "Mot de passe oublié" };

export default async function ForgotPasswordPage() {
  const t = await getTranslator();

  return (
    <div className="animate-rise">
      <h1 className="text-3xl">{t("auth.forgotTitle")}</h1>
      <p className="prose-body mt-2 text-sm">{t("auth.forgotBody")}</p>
      <ForgotForm />
      <p className="mt-6 text-sm">
        <Link href="/login" className="text-ink-faint underline underline-offset-4 hover:text-ink">
          {t("common.back")}
        </Link>
      </p>
    </div>
  );
}

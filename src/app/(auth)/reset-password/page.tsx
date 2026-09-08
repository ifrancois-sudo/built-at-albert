import type { Metadata } from "next";
import { getTranslator } from "@/i18n/server";
import { ResetForm } from "./reset-form";

export const metadata: Metadata = { title: "Nouveau mot de passe" };

export default async function ResetPasswordPage() {
  const t = await getTranslator();

  return (
    <div className="animate-rise">
      <h1 className="text-3xl">{t("auth.resetTitle")}</h1>
      <ResetForm />
    </div>
  );
}

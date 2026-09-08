import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getTranslator } from "@/i18n/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { ResendVerification } from "./resend-verification";

export const metadata: Metadata = { title: "Confirmer votre email" };

export default async function VerifyEmailPage() {
  const t = await getTranslator();
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");
  if (user.email_confirmed_at) redirect("/ideas");

  return (
    <div className="animate-rise">
      <h1 className="text-3xl">{t("auth.verifyTitle")}</h1>
      <p className="prose-body mt-3">{t("auth.verifyBody", { email: user.email ?? "" })}</p>
      <ResendVerification />
    </div>
  );
}

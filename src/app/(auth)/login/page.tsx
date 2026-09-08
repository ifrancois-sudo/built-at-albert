import type { Metadata } from "next";
import Link from "next/link";
import { getTranslator } from "@/i18n/server";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Connexion" };

export default async function LoginPage() {
  const t = await getTranslator();

  return (
    <div className="animate-rise">
      <h1 className="text-3xl">{t("auth.loginTitle")}</h1>
      <LoginForm />
      <div className="mt-6 flex flex-col gap-2 text-sm text-ink-faint">
        <p>
          {t("auth.loginNoAccount")}{" "}
          <Link href="/signup" className="text-accent-ink underline underline-offset-4">
            {t("nav.signup")}
          </Link>
        </p>
        <Link href="/forgot-password" className="underline underline-offset-4 hover:text-ink">
          {t("auth.loginForgot")}
        </Link>
      </div>
    </div>
  );
}

"use client";

import { useSession } from "@/lib/session";
import { useT } from "@/i18n/provider";
import { Home } from "@/app/home";
import { Marketing } from "@/app/marketing";

// The root is the platform's front door for everyone. A signed-in student gets
// the state of the board; a visitor gets the explanation. It no longer bounces
// anyone straight into a list.
export default function RootPage() {
  const t = useT();
  const { loading, verified } = useSession();

  if (loading) {
    return <p className="mx-auto max-w-6xl px-5 py-24 text-ink-faint sm:px-8">{t("common.loading")}</p>;
  }

  return verified ? <Home /> : <Marketing />;
}

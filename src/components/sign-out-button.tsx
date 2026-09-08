"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { createClient } from "@/lib/supabase/client";
import { useT } from "@/i18n/provider";

export function SignOutButton() {
  const t = useT();
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      className="btn btn-ghost h-9 min-h-0 px-2 text-sm"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          await createClient().auth.signOut();
          router.replace("/");
          router.refresh();
        })
      }
    >
      {t("common.signOut")}
    </button>
  );
}

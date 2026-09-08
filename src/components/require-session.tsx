"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useSession } from "@/lib/session";
import { useT } from "@/i18n/provider";

/**
 * Keeps signed-out and unverified visitors off a page.
 *
 * This is a convenience, not the security boundary. Row level security is what
 * actually refuses the data, and it has been verified against the API directly;
 * this only saves the visitor from staring at an empty screen.
 */
export function RequireSession({
  admin = false,
  children,
}: {
  admin?: boolean;
  children: React.ReactNode;
}) {
  const t = useT();
  const router = useRouter();
  const { loading, user, verified, profile, isAdmin } = useSession();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace(`/login/?next=${encodeURIComponent(window.location.pathname)}`);
      return;
    }
    if (!verified) {
      router.replace("/verify-email/");
      return;
    }
    if (admin && profile && !isAdmin) router.replace("/ideas/");
  }, [loading, user, verified, admin, isAdmin, profile, router]);

  if (loading || !user || !verified || (admin && !isAdmin)) {
    return (
      <p className="mx-auto max-w-4xl px-4 py-20 text-sm text-ink-faint sm:px-6">
        {t("common.loading")}
      </p>
    );
  }

  return <>{children}</>;
}

"use client";

import { useActionState } from "react";
import { setUserRoleAction } from "@/app/actions/admin";
import { IDLE_STATE } from "@/lib/action-state";
import { useT } from "@/i18n/provider";
import type { UserRole } from "@/lib/database.types";

export function MemberRow({
  userId,
  name,
  promo,
  campus,
  role,
  isSelf,
}: {
  userId: string;
  name: string;
  promo: string | null;
  campus: string | null;
  role: UserRole;
  isSelf: boolean;
}) {
  const t = useT();
  const [, action, pending] = useActionState(setUserRoleAction, IDLE_STATE);
  const isAdmin = role === "admin";

  return (
    <li className="surface flex flex-wrap items-center gap-3 p-4">
      <div className="min-w-0 flex-1">
        <p>
          {name}
          {isAdmin ? <span className="badge bg-accent-soft text-accent-ink ml-2">admin</span> : null}
        </p>
        <p className="text-xs text-ink-faint">
          {[promo, campus].filter(Boolean).join(" · ") || "—"}
        </p>
      </div>

      {/* An admin cannot demote themselves, so the platform is never left with
          nobody able to moderate. */}
      {isSelf ? (
        <span className="text-xs text-ink-faint">—</span>
      ) : (
        <form action={action}>
          <input type="hidden" name="user_id" value={userId} />
          <input type="hidden" name="role" value={isAdmin ? "student" : "admin"} />
          <button
            type="submit"
            className="btn btn-secondary h-9 min-h-0 px-3 text-sm"
            disabled={pending}
          >
            {isAdmin ? t("admin.demote") : t("admin.promote")}
          </button>
        </form>
      )}
    </li>
  );
}

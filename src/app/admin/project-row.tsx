"use client";

import { useActionState } from "react";
import { setProjectVisibilityAction } from "@/app/actions/admin";
import { IDLE_STATE } from "@/lib/action-state";
import { useT } from "@/i18n/provider";

export function ProjectRow({
  projectId,
  ideaTitle,
  url,
  isPublic,
}: {
  projectId: string;
  ideaTitle: string;
  url: string;
  isPublic: boolean;
}) {
  const t = useT();
  const [, action, pending] = useActionState(setProjectVisibilityAction, IDLE_STATE);

  return (
    <li className="surface flex flex-wrap items-center gap-3 p-4">
      <div className="min-w-0 flex-1">
        <p>{ideaTitle}</p>
        <a
          href={url}
          target="_blank"
          rel="noreferrer noopener"
          className="block truncate text-xs text-ink-faint underline underline-offset-4"
        >
          {url}
        </a>
      </div>
      {!isPublic ? <span className="badge bg-paper-sunk text-ink-faint">off</span> : null}
      <form action={action}>
        <input type="hidden" name="project_id" value={projectId} />
        <input type="hidden" name="is_public" value={isPublic ? "false" : "true"} />
        <button
          type="submit"
          className={`btn h-9 min-h-0 px-3 text-sm ${isPublic ? "btn-danger" : "btn-secondary"}`}
          disabled={pending}
        >
          {isPublic ? t("admin.unpublish") : t("admin.publish")}
        </button>
      </form>
    </li>
  );
}

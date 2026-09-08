"use client";

import { useActionState, useState } from "react";
import { moderateIdeaAction } from "@/app/actions/admin";
import { IDLE_STATE } from "@/lib/action-state";
import { useT } from "@/i18n/provider";
import { FormMessage } from "@/components/form-message";

export function ModerationCard({
  ideaId,
  title,
  problem,
  description,
  tags,
  authorName,
  createdLabel,
}: {
  ideaId: string;
  title: string;
  problem: string;
  description: string;
  tags: string[];
  authorName: string;
  createdLabel: string;
}) {
  const t = useT();
  const [state, action, pending] = useActionState(moderateIdeaAction, IDLE_STATE);
  const [rejecting, setRejecting] = useState(false);

  return (
    <article className="surface p-5">
      <h3 className="text-lg leading-snug">{title}</h3>
      <p className="mt-1 text-xs text-ink-faint">
        {t("ideas.byAuthor", { name: authorName })} · {createdLabel}
        {tags.length > 0 ? ` · ${tags.map((tag) => `#${tag}`).join(" ")}` : ""}
      </p>

      <p className="prose-body mt-3 whitespace-pre-line text-sm">{problem}</p>
      {description ? (
        <p className="prose-body mt-2 whitespace-pre-line text-sm">{description}</p>
      ) : null}

      {state.status !== "idle" && state.messageKey ? (
        <div className="mt-4">
          <FormMessage
            tone={state.status === "error" ? "error" : "success"}
            messageKey={state.messageKey}
          />
        </div>
      ) : null}

      <form action={action} className="mt-4 flex flex-col gap-3">
        <input type="hidden" name="idea_id" value={ideaId} />

        {rejecting ? (
          <div>
            <label className="field-label" htmlFor={`reason-${ideaId}`}>
              {t("admin.rejectReason")}
            </label>
            <textarea id={`reason-${ideaId}`} name="reason" rows={2} required className="input" />
          </div>
        ) : null}

        <div className="flex flex-wrap gap-2">
          <button
            type="submit"
            name="decision"
            value="approve"
            className="btn btn-primary h-10 min-h-0"
            disabled={pending || rejecting}
          >
            {t("admin.approve")}
          </button>

          {rejecting ? (
            <>
              <button
                type="submit"
                name="decision"
                value="reject"
                className="btn btn-danger h-10 min-h-0"
                disabled={pending}
              >
                {t("admin.reject")}
              </button>
              <button
                type="button"
                className="btn btn-ghost h-10 min-h-0"
                onClick={() => setRejecting(false)}
              >
                {t("common.cancel")}
              </button>
            </>
          ) : (
            <button
              type="button"
              className="btn btn-secondary h-10 min-h-0"
              onClick={() => setRejecting(true)}
            >
              {t("admin.reject")}
            </button>
          )}
        </div>
      </form>
    </article>
  );
}

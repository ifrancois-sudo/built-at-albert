"use client";

import { useState } from "react";
import { useT } from "@/i18n/provider";
import { FormMessage } from "@/components/form-message";
import { moderateIdea } from "@/lib/api/admin";
import { errorMessageKey } from "@/lib/errors";
import type { IdeaRow } from "@/lib/database.types";
import type { MessageKey } from "@/i18n";

export function ModerationCard({
  idea,
  authorName,
  createdLabel,
  onDone,
}: {
  idea: IdeaRow;
  authorName: string;
  createdLabel: string;
  onDone: () => Promise<void>;
}) {
  const t = useT();
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<MessageKey | null>(null);

  async function decide(approve: boolean) {
    if (!approve && reason.trim().length === 0) return setError("errors.reason_required");

    setPending(true);
    setError(null);
    const { error: rpcError } = await moderateIdea(idea.id, approve, reason.trim());
    setPending(false);

    if (rpcError) return setError(errorMessageKey(rpcError));
    await onDone();
  }

  return (
    <article className="surface p-5">
      <h3 className="text-lg leading-snug">{idea.title}</h3>
      <p className="mt-1 text-xs text-ink-faint">
        {t("ideas.byAuthor", { name: authorName })} · {createdLabel}
        {idea.tags.length > 0 ? ` · ${idea.tags.map((tag) => `#${tag}`).join(" ")}` : ""}
      </p>

      <p className="prose-body mt-3 whitespace-pre-line text-sm">{idea.problem}</p>
      {idea.description ? (
        <p className="prose-body mt-2 whitespace-pre-line text-sm">{idea.description}</p>
      ) : null}

      {error ? (
        <div className="mt-4">
          <FormMessage tone="error" messageKey={error} />
        </div>
      ) : null}

      {rejecting ? (
        <div className="mt-4">
          <label className="field-label" htmlFor={`reason-${idea.id}`}>
            {t("admin.rejectReason")}
          </label>
          <textarea
            id={`reason-${idea.id}`}
            rows={2}
            className="input"
            value={reason}
            onChange={(event) => setReason(event.target.value)}
          />
        </div>
      ) : null}

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          className="btn btn-primary h-10 min-h-0"
          disabled={pending || rejecting}
          onClick={() => decide(true)}
        >
          {t("admin.approve")}
        </button>

        {rejecting ? (
          <>
            <button
              type="button"
              className="btn btn-danger h-10 min-h-0"
              disabled={pending}
              onClick={() => decide(false)}
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
    </article>
  );
}

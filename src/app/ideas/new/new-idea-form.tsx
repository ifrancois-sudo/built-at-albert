"use client";

import Link from "next/link";
import { useActionState } from "react";
import { submitIdeaAction } from "@/app/actions/ideas";
import { IDLE_STATE } from "@/lib/action-state";
import { useT } from "@/i18n/provider";
import { FormMessage } from "@/components/form-message";
import { LOCALES } from "@/i18n";

export function NewIdeaForm({ defaultCampus }: { defaultCampus: string }) {
  const t = useT();
  const [state, action, pending] = useActionState(submitIdeaAction, IDLE_STATE);

  if (state.status === "success" && state.messageKey) {
    return (
      <div className="mt-6 flex flex-col items-start gap-4">
        <FormMessage tone="success" messageKey={state.messageKey} />
        <Link href="/ideas" className="btn btn-secondary">
          {t("nav.ideas")}
        </Link>
      </div>
    );
  }

  return (
    <form action={action} className="mt-8 flex flex-col gap-5">
      {state.status === "error" && state.messageKey ? (
        <FormMessage tone="error" messageKey={state.messageKey} params={state.params} />
      ) : null}

      <div>
        <label className="field-label" htmlFor="title">
          {t("ideas.fieldTitle")}
        </label>
        <input id="title" name="title" required minLength={3} maxLength={120} className="input" />
        <p className="field-hint">{t("ideas.fieldTitleHint")}</p>
      </div>

      <div>
        <label className="field-label" htmlFor="problem">
          {t("ideas.fieldProblem")}
        </label>
        <textarea id="problem" name="problem" required minLength={10} rows={4} className="input" />
        <p className="field-hint">{t("ideas.fieldProblemHint")}</p>
      </div>

      <div>
        <label className="field-label" htmlFor="description">
          {t("ideas.fieldDescription")} <span className="font-normal text-ink-faint">({t("common.optional")})</span>
        </label>
        <textarea id="description" name="description" rows={4} className="input" />
      </div>

      <div className="grid gap-5 sm:grid-cols-3">
        <div className="sm:col-span-2">
          <label className="field-label" htmlFor="tags">
            {t("ideas.fieldTags")}
          </label>
          <input id="tags" name="tags" className="input" placeholder="planning, cantine, stage" />
          <p className="field-hint">{t("ideas.fieldTagsHint")}</p>
        </div>
        <div>
          <label className="field-label" htmlFor="language">
            {t("ideas.fieldLanguage")}
          </label>
          <select id="language" name="language" className="input" defaultValue={t.locale}>
            {LOCALES.map((locale) => (
              <option key={locale} value={locale}>
                {locale.toUpperCase()}
              </option>
            ))}
          </select>
        </div>
      </div>

      <input type="hidden" name="campus" value={defaultCampus} />

      <button type="submit" className="btn btn-primary self-start" disabled={pending}>
        {pending ? t("common.loading") : t("ideas.newSubmit")}
      </button>
    </form>
  );
}

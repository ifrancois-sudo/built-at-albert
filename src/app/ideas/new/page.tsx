"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { useSession } from "@/lib/session";
import { useLocale, useT } from "@/i18n/provider";
import { RequireSession } from "@/components/require-session";
import { FormMessage } from "@/components/form-message";
import { submitIdea } from "@/lib/api/ideas";
import { errorMessageKey } from "@/lib/errors";
import { LOCALES, type Locale, type MessageKey } from "@/i18n";

export default function NewIdeaPage() {
  return (
    <RequireSession>
      <NewIdeaForm />
    </RequireSession>
  );
}

function NewIdeaForm() {
  const t = useT();
  const { locale } = useLocale();
  const { profile } = useSession();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<MessageKey | null>(null);
  const [done, setDone] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const title = String(form.get("title") ?? "").trim();
    const problem = String(form.get("problem") ?? "").trim();

    if (title.length < 3 || title.length > 120) return setError("ideas.fieldTitleHint");
    if (problem.length < 10) return setError("ideas.fieldProblemHint");

    setPending(true);
    setError(null);

    const { error: insertError } = await submitIdea({
      title,
      problem,
      description: String(form.get("description") ?? "").trim(),
      language: String(form.get("language") ?? locale) as Locale,
      tags: String(form.get("tags") ?? ""),
      campus: profile?.campus ?? null,
    });

    setPending(false);
    if (insertError) return setError(errorMessageKey(insertError));
    setDone(true);
  }

  if (done) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
        <div className="flex flex-col items-start gap-4">
          <FormMessage tone="success" messageKey="ideas.newDone" />
          <Link href="/ideas/" className="btn btn-secondary">
            {t("nav.ideas")}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      <h1 className="text-3xl">{t("ideas.newTitle")}</h1>
      <p className="prose-body mt-1.5 text-sm">{t("ideas.newSubtitle")}</p>

      <form onSubmit={onSubmit} className="mt-8 flex flex-col gap-5">
        {error ? <FormMessage tone="error" messageKey={error} /> : null}

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
            {t("ideas.fieldDescription")}{" "}
            <span className="font-normal text-ink-faint">({t("common.optional")})</span>
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
            <select id="language" name="language" className="input" defaultValue={locale}>
              {LOCALES.map((value) => (
                <option key={value} value={value}>
                  {value.toUpperCase()}
                </option>
              ))}
            </select>
          </div>
        </div>

        <button type="submit" className="btn btn-primary self-start" disabled={pending}>
          {pending ? t("common.loading") : t("ideas.newSubmit")}
        </button>
      </form>
    </div>
  );
}

"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { useSession } from "@/lib/session";
import { useLocale, useT } from "@/i18n/provider";
import { RequireSession } from "@/components/require-session";
import { FormMessage } from "@/components/form-message";
import { similarIdeas, submitIdea } from "@/lib/api/ideas";
import { errorMessageKey } from "@/lib/errors";
import { LOCALES, type Locale, type MessageKey } from "@/i18n";
import type { IdeaRow } from "@/lib/database.types";
import { Segmented } from "@/components/segmented";

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
  const [language, setLanguage] = useState<Locale>(locale);
  const [title, setTitle] = useState("");
  const [duplicates, setDuplicates] = useState<IdeaRow[]>([]);

  // Warns while the title is being written rather than after submitting, when
  // the cost of starting over is what makes people post the duplicate anyway.
  useEffect(() => {
    const trimmed = title.trim();
    let cancelled = false;

    // Clearing goes through the same deferred path as a lookup, so the panel is
    // never updated synchronously from the effect body.
    const timer = setTimeout(() => {
      const lookup = trimmed.length < 6 ? Promise.resolve<IdeaRow[]>([]) : similarIdeas(trimmed);
      void lookup.then((rows) => {
        if (!cancelled) setDuplicates(rows);
      });
    }, 350);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [title]);

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
      language,
      tags: String(form.get("tags") ?? ""),
      campus: profile?.campus ?? null,
    });

    setPending(false);
    if (insertError) return setError(errorMessageKey(insertError));
    setDone(true);
  }

  if (done) {
    return (
      <div className="mx-auto max-w-2xl px-5 py-14 sm:px-6">
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
    <div className="mx-auto max-w-2xl px-5 py-14 sm:px-6">
      <h1 className="text-3xl">{t("ideas.newTitle")}</h1>
      <p className="prose-body mt-2">{t("ideas.newSubtitle")}</p>

      <form onSubmit={onSubmit} className="mt-8 flex flex-col gap-5">
        {error ? <FormMessage tone="error" messageKey={error} /> : null}

        <div>
          <label className="field-label" htmlFor="title">
            {t("ideas.fieldTitle")}
          </label>
          <input
            id="title"
            name="title"
            required
            minLength={3}
            maxLength={120}
            className="input"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
          />
          <p className="field-hint">{t("ideas.fieldTitleHint")}</p>

          {duplicates.length > 0 ? (
            <aside className="mt-4 rounded-[5px] border-2 border-signal bg-signal-soft p-5">
              <p className="kicker text-signal">{t("ideas.duplicateTitle")}</p>
              <ul className="mt-3 flex flex-col gap-2">
                {duplicates.map((idea) => (
                  <li key={idea.id}>
                    <Link
                      href={`/idea/?id=${idea.id}`}
                      className="underline underline-offset-4 hover:text-accent-ink"
                    >
                      {idea.title}
                    </Link>{" "}
                    <span className="meta">
                      {t.plural("ideas.voteCount", "ideas.voteCountPlural", idea.vote_count)}
                    </span>
                  </li>
                ))}
              </ul>
              <p className="prose-body mt-3">{t("ideas.duplicateBody")}</p>
            </aside>
          ) : null}
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
            <span className="field-label">{t("ideas.fieldLanguage")}</span>
            <Segmented
              label={t("ideas.fieldLanguage")}
              value={language}
              onChange={setLanguage}
              options={LOCALES.map((value) => ({ value, label: value.toUpperCase() }))}
            />
          </div>
        </div>

        <button type="submit" className="btn btn-primary self-start" disabled={pending}>
          {pending ? t("common.loading") : t("ideas.newSubmit")}
        </button>
      </form>
    </div>
  );
}

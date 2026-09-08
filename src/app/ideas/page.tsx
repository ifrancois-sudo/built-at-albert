"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useSession } from "@/lib/session";
import { useT } from "@/i18n/provider";
import { RequireSession } from "@/components/require-session";
import { IdeaCard } from "@/components/idea-card";
import { listFacets, listOpenIdeas, type IdeaCardModel, type IdeaSort } from "@/lib/api/ideas";

export default function IdeasPage() {
  return (
    <RequireSession>
      <IdeasBoard />
    </RequireSession>
  );
}

function IdeasBoard() {
  const t = useT();
  const { user } = useSession();
  const viewerId = user?.id ?? "";

  const [sort, setSort] = useState<IdeaSort>("votes");
  const [tag, setTag] = useState("");
  const [campus, setCampus] = useState("");
  const [cards, setCards] = useState<IdeaCardModel[] | null>(null);
  const [facets, setFacets] = useState<{ tags: string[]; campuses: string[] }>({
    tags: [],
    campuses: [],
  });

  const load = useCallback(
    () =>
      listOpenIdeas(viewerId, {
        sort,
        tag: tag || undefined,
        campus: campus || undefined,
      }),
    [viewerId, sort, tag, campus],
  );

  useEffect(() => {
    let cancelled = false;
    void load().then((rows) => {
      if (!cancelled) setCards(rows);
    });
    return () => {
      cancelled = true;
    };
  }, [load]);

  useEffect(() => {
    let cancelled = false;
    void listFacets().then((next) => {
      if (!cancelled) setFacets(next);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl">{t("ideas.listTitle")}</h1>
          <p className="prose-body mt-1.5 text-sm">{t("ideas.listSubtitle")}</p>
        </div>
        <Link href="/ideas/new/" className="btn btn-primary">
          {t("ideas.newCta")}
        </Link>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3 border-y border-rule py-3">
        <div className="flex gap-1" role="group">
          {(
            [
              ["votes", t("ideas.sortVotes")],
              ["recent", t("ideas.sortRecent")],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              aria-pressed={sort === value}
              onClick={() => setSort(value)}
              className={`btn h-9 min-h-0 px-3 text-sm ${sort === value ? "btn-secondary" : "btn-ghost"}`}
            >
              {label}
            </button>
          ))}
        </div>

        {facets.tags.length > 0 ? (
          <label className="ml-auto flex items-center gap-2 text-sm text-ink-faint">
            <span>{t("ideas.filterTag")}</span>
            <select
              className="input h-9 min-h-0 w-auto py-1 text-sm"
              value={tag}
              onChange={(event) => setTag(event.target.value)}
            >
              <option value="">{t("ideas.filterAll")}</option>
              {facets.tags.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </label>
        ) : null}

        {facets.campuses.length > 0 ? (
          <label className="flex items-center gap-2 text-sm text-ink-faint">
            <span>{t("ideas.filterCampus")}</span>
            <select
              className="input h-9 min-h-0 w-auto py-1 text-sm"
              value={campus}
              onChange={(event) => setCampus(event.target.value)}
            >
              <option value="">{t("ideas.filterAll")}</option>
              {facets.campuses.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </label>
        ) : null}
      </div>

      {cards === null ? (
        <p className="mt-6 text-sm text-ink-faint">{t("common.loading")}</p>
      ) : cards.length === 0 ? (
        <p className="surface mt-6 p-8 text-center text-sm text-ink-faint">{t("ideas.empty")}</p>
      ) : (
        <div className="mt-6 flex flex-col gap-3">
          {cards.map((card) => (
            <IdeaCard key={card.idea.id} card={card} viewerId={viewerId} />
          ))}
        </div>
      )}
    </div>
  );
}

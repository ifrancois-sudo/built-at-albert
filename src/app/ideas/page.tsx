"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useSession } from "@/lib/session";
import { useT } from "@/i18n/provider";
import { RequireSession } from "@/components/require-session";
import { IdeaCard } from "@/components/idea-card";
import { Segmented } from "@/components/segmented";
import { Select } from "@/components/select";
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
    <div className="mx-auto max-w-5xl px-5 py-14 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl">{t("ideas.listTitle")}</h1>
          <p className="prose-body mt-2">{t("ideas.listSubtitle")}</p>
        </div>
        <Link href="/ideas/new/" className="btn btn-primary">
          {t("ideas.newCta")}
        </Link>
      </div>

      <div className="mt-8 flex flex-wrap items-center gap-3 border-y-2 border-ink py-4">
        <Segmented
          label={t("ideas.sortVotes")}
          value={sort}
          onChange={setSort}
          options={[
            { value: "votes", label: t("ideas.sortVotes") },
            { value: "recent", label: t("ideas.sortRecent") },
          ]}
        />

        {facets.tags.length > 0 ? (
          <div className="ml-auto">
            <Select
              label={t("ideas.filterTag")}
              placeholder={`${t("ideas.filterTag")} · ${t("ideas.filterAll")}`}
              value={tag}
              onChange={setTag}
              options={facets.tags.map((value) => ({ value, label: value }))}
            />
          </div>
        ) : null}

        {facets.campuses.length > 0 ? (
          <Select
            label={t("ideas.filterCampus")}
            placeholder={`${t("ideas.filterCampus")} · ${t("ideas.filterAll")}`}
            value={campus}
            onChange={setCampus}
            options={facets.campuses.map((value) => ({ value, label: value }))}
          />
        ) : null}
      </div>


      {cards === null ? (
        <p className="mt-6 text-sm text-ink-faint">{t("common.loading")}</p>
      ) : cards.length === 0 ? (
        <p className="surface mt-6 p-10 text-center text-ink-faint">{t("ideas.empty")}</p>
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

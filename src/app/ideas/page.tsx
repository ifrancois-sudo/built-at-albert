import type { Metadata } from "next";
import Link from "next/link";
import { requireViewer } from "@/lib/auth";
import { createServerSupabase } from "@/lib/supabase/server";
import { getTranslator } from "@/i18n/server";
import { listFacets, listOpenIdeas, type IdeaSort } from "@/lib/data/ideas";
import { IdeaCard } from "@/components/idea-card";
import { IdeaFilterBar } from "./filter-bar";

export const metadata: Metadata = { title: "Idées" };

export default async function IdeasPage({
  searchParams,
}: {
  searchParams: Promise<{ sort?: string; tag?: string; campus?: string }>;
}) {
  const viewer = await requireViewer();
  const t = await getTranslator();
  const params = await searchParams;
  const sort: IdeaSort = params.sort === "recent" ? "recent" : "votes";

  const supabase = await createServerSupabase();
  const [cards, facets] = await Promise.all([
    listOpenIdeas(supabase, viewer.id, { sort, tag: params.tag, campus: params.campus }),
    listFacets(supabase),
  ]);

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl">{t("ideas.listTitle")}</h1>
          <p className="prose-body mt-1.5 text-sm">{t("ideas.listSubtitle")}</p>
        </div>
        <Link href="/ideas/new" className="btn btn-primary">
          {t("ideas.newCta")}
        </Link>
      </div>

      <IdeaFilterBar
        sort={sort}
        tag={params.tag ?? ""}
        campus={params.campus ?? ""}
        tags={facets.tags}
        campuses={facets.campuses}
      />

      {cards.length === 0 ? (
        <p className="surface mt-6 p-8 text-center text-sm text-ink-faint">{t("ideas.empty")}</p>
      ) : (
        <div className="mt-6 flex flex-col gap-3">
          {cards.map((card) => (
            <IdeaCard key={card.idea.id} card={card} viewerId={viewer.id} t={t} />
          ))}
        </div>
      )}
    </div>
  );
}

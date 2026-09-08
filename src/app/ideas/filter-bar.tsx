"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useT } from "@/i18n/provider";

export function IdeaFilterBar({
  sort,
  tag,
  campus,
  tags,
  campuses,
}: {
  sort: string;
  tag: string;
  campus: string;
  tags: string[];
  campuses: string[];
}) {
  const t = useT();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function update(key: string, value: string) {
    const next = new URLSearchParams(searchParams.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    router.replace(`${pathname}?${next.toString()}`);
  }

  return (
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
            onClick={() => update("sort", value === "votes" ? "" : value)}
            className={`btn h-9 min-h-0 px-3 text-sm ${
              sort === value ? "btn-secondary" : "btn-ghost"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tags.length > 0 ? (
        <label className="ml-auto flex items-center gap-2 text-sm text-ink-faint">
          <span>{t("ideas.filterTag")}</span>
          <select
            className="input h-9 min-h-0 w-auto py-1 text-sm"
            value={tag}
            onChange={(event) => update("tag", event.target.value)}
          >
            <option value="">{t("ideas.filterAll")}</option>
            {tags.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </label>
      ) : null}

      {campuses.length > 0 ? (
        <label className="flex items-center gap-2 text-sm text-ink-faint">
          <span>{t("ideas.filterCampus")}</span>
          <select
            className="input h-9 min-h-0 w-auto py-1 text-sm"
            value={campus}
            onChange={(event) => update("campus", event.target.value)}
          >
            <option value="">{t("ideas.filterAll")}</option>
            {campuses.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </label>
      ) : null}
    </div>
  );
}

"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useT } from "@/i18n/provider";
import { RequireSession } from "@/components/require-session";
import { listPublicProjects } from "@/lib/api/projects";
import { displayName, fetchProfiles, type ProfileMap } from "@/lib/api/profiles";
import { supabase } from "@/lib/supabase/client";
import type { ProjectRow } from "@/lib/database.types";

export default function ProjectsPage() {
  return (
    <RequireSession>
      <Gallery />
    </RequireSession>
  );
}

function Gallery() {
  const t = useT();
  const [projects, setProjects] = useState<ProjectRow[] | null>(null);
  const [authors, setAuthors] = useState<ProfileMap>(new Map());
  const [titles, setTitles] = useState<Map<string, string>>(new Map());

  useEffect(() => {
    async function load() {
      const rows = await listPublicProjects();
      setProjects(rows);
      if (rows.length === 0) return;

      const [profileMap, ideas] = await Promise.all([
        fetchProfiles(rows.map((project) => project.author_id)),
        supabase()
          .from("ideas")
          .select("id, title")
          .in("id", rows.map((project) => project.idea_id)),
      ]);

      setAuthors(profileMap);
      setTitles(new Map((ideas.data ?? []).map((idea) => [idea.id, idea.title])));
    }

    void load();
  }, []);

  return (
    <div className="mx-auto max-w-6xl px-5 py-14 sm:px-6">
      <h1 className="text-3xl">{t("gallery.title")}</h1>
      <p className="prose-body mt-2">{t("gallery.subtitle")}</p>

      {projects === null ? (
        <p className="mt-8 text-sm text-ink-faint">{t("common.loading")}</p>
      ) : projects.length === 0 ? (
        <p className="surface mt-8 p-10 text-center text-ink-faint">{t("gallery.empty")}</p>
      ) : (
        <ul className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <li key={project.id} className="surface flex flex-col overflow-hidden">
              {project.screenshots[0] ? (
                // Storage serves these already sized, and the static export has
                // no image optimiser, so a plain img is the honest choice.
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={project.screenshots[0]}
                  alt=""
                  loading="lazy"
                  className="aspect-[16/10] w-full border-b border-rule object-cover"
                />
              ) : null}

              <div className="flex flex-1 flex-col p-5">
                <h2 className="text-lg leading-snug">
                  <Link href={`/idea/?id=${project.idea_id}`} className="hover:text-accent-ink">
                    {titles.get(project.idea_id) ?? "—"}
                  </Link>
                </h2>
                <p className="prose-body mt-3 line-clamp-3 flex-1">{project.description}</p>
                <p className="meta mt-4">
                  {t("ideas.byAuthor", { name: displayName(authors.get(project.author_id ?? ""), "—") })}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <a
                    href={project.url}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="btn btn-primary btn-sm"
                  >
                    {t("gallery.openTool")}
                  </a>
                  {project.repo_url ? (
                    <a
                      href={project.repo_url}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="btn btn-secondary btn-sm"
                    >
                      {t("gallery.viewRepo")}
                    </a>
                  ) : null}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

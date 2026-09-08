import type { Metadata } from "next";
import Link from "next/link";
import { requireViewer } from "@/lib/auth";
import { createServerSupabase } from "@/lib/supabase/server";
import { getTranslator } from "@/i18n/server";
import { fetchProfiles, displayName } from "@/lib/data/profiles";

export const metadata: Metadata = { title: "Outils livrés" };

export default async function ProjectsPage() {
  await requireViewer();
  const t = await getTranslator();
  const supabase = await createServerSupabase();

  const { data: projects } = await supabase
    .from("projects")
    .select("*")
    .eq("is_public", true)
    .order("published_at", { ascending: false });

  const rows = projects ?? [];
  const [authors, ideasResult] = await Promise.all([
    fetchProfiles(supabase, rows.map((project) => project.author_id)),
    rows.length > 0
      ? supabase
          .from("ideas")
          .select("id, title")
          .in("id", rows.map((project) => project.idea_id))
      : Promise.resolve({ data: [] as { id: string; title: string }[] }),
  ]);

  const ideaTitles = new Map((ideasResult.data ?? []).map((idea) => [idea.id, idea.title]));

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <h1 className="text-3xl">{t("gallery.title")}</h1>
      <p className="prose-body mt-1.5 text-sm">{t("gallery.subtitle")}</p>

      {rows.length === 0 ? (
        <p className="surface mt-8 p-8 text-center text-sm text-ink-faint">{t("gallery.empty")}</p>
      ) : (
        <ul className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map((project) => (
            <li key={project.id} className="surface flex flex-col overflow-hidden">
              {project.screenshots[0] ? (
                // Storage serves these already sized; Next's optimizer does not
                // run on Workers, so a plain img is the honest choice here.
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
                  <Link href={`/ideas/${project.idea_id}`} className="hover:text-accent-ink">
                    {ideaTitles.get(project.idea_id) ?? "—"}
                  </Link>
                </h2>
                <p className="prose-body mt-2 line-clamp-3 flex-1 text-sm">{project.description}</p>
                <p className="mt-3 text-xs text-ink-faint">
                  {t("ideas.byAuthor", {
                    name: displayName(authors.get(project.author_id), "—"),
                  })}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <a
                    href={project.url}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="btn btn-primary h-9 min-h-0 px-3 text-sm"
                  >
                    {t("gallery.openTool")}
                  </a>
                  {project.repo_url ? (
                    <a
                      href={project.repo_url}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="btn btn-secondary h-9 min-h-0 px-3 text-sm"
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

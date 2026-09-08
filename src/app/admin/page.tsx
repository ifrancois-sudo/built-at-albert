import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { createServerSupabase } from "@/lib/supabase/server";
import { getLocale, getTranslator } from "@/i18n/server";
import { fetchProfiles, displayName } from "@/lib/data/profiles";
import { formatDate } from "@/lib/format";
import { ModerationCard } from "./moderation-card";
import { ClaimRow } from "./claim-row";
import { ProjectRow } from "./project-row";
import { MemberRow } from "./member-row";

export const metadata: Metadata = { title: "Modération" };

export default async function AdminPage() {
  const viewer = await requireAdmin();
  const [t, locale] = await Promise.all([getTranslator(), getLocale()]);
  const supabase = await createServerSupabase();

  const [pendingResult, claimsResult, projectsResult, membersResult] = await Promise.all([
    supabase.from("ideas").select("*").eq("status", "pending").order("created_at"),
    supabase.from("claims").select("*").eq("status", "active").order("expires_at"),
    supabase.from("projects").select("*").order("published_at", { ascending: false }),
    supabase
      .from("profiles")
      .select("id, full_name, promo, campus, role, locale, created_at")
      .order("created_at", { ascending: false })
      .limit(200),
  ]);

  const pending = pendingResult.data ?? [];
  const claims = claimsResult.data ?? [];
  const projects = projectsResult.data ?? [];
  const members = membersResult.data ?? [];

  const relatedIdeaIds = [...claims.map((c) => c.idea_id), ...projects.map((p) => p.idea_id)];
  const [authors, relatedIdeas] = await Promise.all([
    fetchProfiles(supabase, [
      ...pending.map((idea) => idea.author_id),
      ...claims.map((claim) => claim.user_id),
    ]),
    relatedIdeaIds.length > 0
      ? supabase.from("ideas").select("id, title").in("id", relatedIdeaIds)
      : Promise.resolve({ data: [] as { id: string; title: string }[] }),
  ]);

  const ideaTitles = new Map((relatedIdeas.data ?? []).map((idea) => [idea.id, idea.title]));

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <h1 className="text-3xl">{t("admin.title")}</h1>

      <section className="mt-10">
        <h2 className="text-xl">
          {t("admin.queue")}{" "}
          {pending.length > 0 ? (
            <span className="badge bg-signal-soft text-signal align-middle">{pending.length}</span>
          ) : null}
        </h2>
        {pending.length === 0 ? (
          <p className="surface mt-4 p-6 text-sm text-ink-faint">{t("admin.queueEmpty")}</p>
        ) : (
          <div className="mt-4 flex flex-col gap-4">
            {pending.map((idea) => (
              <ModerationCard
                key={idea.id}
                ideaId={idea.id}
                title={idea.title}
                problem={idea.problem}
                description={idea.description}
                tags={idea.tags}
                authorName={displayName(authors.get(idea.author_id), "—")}
                createdLabel={formatDate(idea.created_at, locale)}
              />
            ))}
          </div>
        )}
      </section>

      <section className="mt-12">
        <h2 className="text-xl">{t("admin.claims")}</h2>
        {claims.length === 0 ? (
          <p className="surface mt-4 p-6 text-sm text-ink-faint">{t("admin.claimsEmpty")}</p>
        ) : (
          <ul className="mt-4 flex flex-col gap-2">
            {claims.map((claim) => (
              <ClaimRow
                key={claim.id}
                claimId={claim.id}
                ideaId={claim.idea_id}
                ideaTitle={ideaTitles.get(claim.idea_id) ?? "—"}
                holderName={displayName(authors.get(claim.user_id), "—")}
                expiresLabel={formatDate(claim.expires_at, locale)}
              />
            ))}
          </ul>
        )}
      </section>

      <section className="mt-12">
        <h2 className="text-xl">{t("admin.projects")}</h2>
        <ul className="mt-4 flex flex-col gap-2">
          {projects.map((project) => (
            <ProjectRow
              key={project.id}
              projectId={project.id}
              ideaTitle={ideaTitles.get(project.idea_id) ?? "—"}
              url={project.url}
              isPublic={project.is_public}
            />
          ))}
          {projects.length === 0 ? (
            <li className="surface p-6 text-sm text-ink-faint">{t("gallery.empty")}</li>
          ) : null}
        </ul>
      </section>

      <section className="mt-12">
        <h2 className="text-xl">{t("admin.people")}</h2>
        <ul className="mt-4 flex flex-col gap-2">
          {members.map((member) => (
            <MemberRow
              key={member.id}
              userId={member.id}
              name={displayName(member, member.id.slice(0, 8))}
              promo={member.promo}
              campus={member.campus}
              role={member.role}
              isSelf={member.id === viewer.id}
            />
          ))}
        </ul>
      </section>

      <p className="mt-12 text-sm">
        <Link href="/ideas" className="text-ink-faint underline underline-offset-4 hover:text-ink">
          {t("common.back")}
        </Link>
      </p>
    </div>
  );
}

"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useSession } from "@/lib/session";
import { useLocale, useT } from "@/i18n/provider";
import { RequireSession } from "@/components/require-session";
import { FormMessage } from "@/components/form-message";
import { ModerationCard } from "@/app/admin/moderation-card";
import {
  listActiveClaims,
  listAllProjects,
  listMembers,
  listPendingIdeas,
  setProjectVisibility,
  setUserRole,
} from "@/lib/api/admin";
import { releaseClaim } from "@/lib/api/claims";
import { displayName, fetchProfiles, type ProfileMap } from "@/lib/api/profiles";
import { supabase } from "@/lib/supabase/client";
import { errorMessageKey } from "@/lib/errors";
import { formatDate } from "@/lib/format";
import type { ClaimRow, IdeaRow, ProfileRow, ProjectRow } from "@/lib/database.types";
import type { MessageKey } from "@/i18n";

export default function AdminPage() {
  return (
    <RequireSession admin>
      <AdminConsole />
    </RequireSession>
  );
}

function AdminConsole() {
  const t = useT();
  const { locale } = useLocale();
  const { user } = useSession();

  // The console reads four lists that have to agree with each other, so they
  // are fetched and applied as one snapshot rather than four races.
  interface Snapshot {
    pending: IdeaRow[];
    claims: ClaimRow[];
    projects: ProjectRow[];
    members: ProfileRow[];
    people: ProfileMap;
    titles: Map<string, string>;
  }

  const [data, setData] = useState<Snapshot | null>(null);
  const [message, setMessage] = useState<{ tone: "error" | "success"; key: MessageKey } | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async (): Promise<Snapshot> => {
    const [pendingResult, claimResult, projectResult, memberResult] = await Promise.all([
      listPendingIdeas(),
      listActiveClaims(),
      listAllProjects(),
      listMembers(),
    ]);

    const pendingIdeas = pendingResult.data ?? [];
    const activeClaims = claimResult.data ?? [];
    const allProjects = projectResult.data ?? [];

    const people = await fetchProfiles([
      ...pendingIdeas.map((idea) => idea.author_id),
      ...activeClaims.map((claim) => claim.user_id),
    ]);

    const relatedIds = [
      ...activeClaims.map((claim) => claim.idea_id),
      ...allProjects.map((project) => project.idea_id),
    ];

    let titles = new Map<string, string>();
    if (relatedIds.length > 0) {
      const { data: rows } = await supabase().from("ideas").select("id, title").in("id", relatedIds);
      titles = new Map((rows ?? []).map((idea) => [idea.id, idea.title]));
    }

    return {
      pending: pendingIdeas,
      claims: activeClaims,
      projects: allProjects,
      members: memberResult.data ?? [],
      people,
      titles,
    };
  }, []);

  const refresh = useCallback(async () => {
    setData(await load());
  }, [load]);

  useEffect(() => {
    let cancelled = false;
    void load().then((next) => {
      if (!cancelled) setData(next);
    });
    return () => {
      cancelled = true;
    };
  }, [load]);

  async function run(action: () => Promise<{ error: unknown }>, successKey: MessageKey) {
    setBusy(true);
    setMessage(null);
    const { error } = await action();
    setBusy(false);

    if (error) return setMessage({ tone: "error", key: errorMessageKey(error) });
    setMessage({ tone: "success", key: successKey });
    await refresh();
  }

  if (!data) {
    return (
      <p className="mx-auto max-w-4xl px-4 py-20 text-sm text-ink-faint sm:px-6">
        {t("common.loading")}
      </p>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <h1 className="text-3xl">{t("admin.title")}</h1>

      {message ? (
        <div className="mt-6">
          <FormMessage tone={message.tone} messageKey={message.key} />
        </div>
      ) : null}

      <section className="mt-10">
        <h2 className="text-xl">
          {t("admin.queue")}{" "}
          {data.pending.length > 0 ? (
            <span className="badge bg-signal-soft align-middle text-signal">{data.pending.length}</span>
          ) : null}
        </h2>
        {data.pending.length === 0 ? (
          <p className="surface mt-4 p-6 text-sm text-ink-faint">{t("admin.queueEmpty")}</p>
        ) : (
          <div className="mt-4 flex flex-col gap-4">
            {data.pending.map((idea) => (
              <ModerationCard
                key={idea.id}
                idea={idea}
                authorName={displayName(data.people.get(idea.author_id), "—")}
                createdLabel={formatDate(idea.created_at, locale)}
                onDone={refresh}
              />
            ))}
          </div>
        )}
      </section>

      <section className="mt-12">
        <h2 className="text-xl">{t("admin.claims")}</h2>
        {data.claims.length === 0 ? (
          <p className="surface mt-4 p-6 text-sm text-ink-faint">{t("admin.claimsEmpty")}</p>
        ) : (
          <ul className="mt-4 flex flex-col gap-2">
            {data.claims.map((claim) => (
              <li key={claim.id} className="surface flex flex-wrap items-center gap-3 p-4">
                <Link href={`/idea/?id=${claim.idea_id}`} className="flex-1 hover:text-accent-ink">
                  {data.titles.get(claim.idea_id) ?? "—"}
                </Link>
                <span className="text-sm text-ink-faint">
                  {displayName(data.people.get(claim.user_id), "—")} ·{" "}
                  {t("ideas.claimedUntil", { date: formatDate(claim.expires_at, locale) })}
                </span>
                <button
                  type="button"
                  className="btn btn-danger h-9 min-h-0 px-3 text-sm"
                  disabled={busy}
                  onClick={() => run(() => releaseClaim(claim.id), "claim.released")}
                >
                  {t("admin.forceRelease")}
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-12">
        <h2 className="text-xl">{t("admin.projects")}</h2>
        <ul className="mt-4 flex flex-col gap-2">
          {data.projects.map((project) => (
            <li key={project.id} className="surface flex flex-wrap items-center gap-3 p-4">
              <div className="min-w-0 flex-1">
                <p>{data.titles.get(project.idea_id) ?? "—"}</p>
                <a
                  href={project.url}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="block truncate text-xs text-ink-faint underline underline-offset-4"
                >
                  {project.url}
                </a>
              </div>
              {!project.is_public ? (
                <span className="badge bg-paper-sunk text-ink-faint">off</span>
              ) : null}
              <button
                type="button"
                className={`btn h-9 min-h-0 px-3 text-sm ${project.is_public ? "btn-danger" : "btn-secondary"}`}
                disabled={busy}
                onClick={() =>
                  run(
                    () => setProjectVisibility(project.id, !project.is_public),
                    "admin.roleUpdated",
                  )
                }
              >
                {project.is_public ? t("admin.unpublish") : t("admin.publish")}
              </button>
            </li>
          ))}
          {data.projects.length === 0 ? (
            <li className="surface p-6 text-sm text-ink-faint">{t("gallery.empty")}</li>
          ) : null}
        </ul>
      </section>

      <section className="mt-12">
        <h2 className="text-xl">{t("admin.people")}</h2>
        <ul className="mt-4 flex flex-col gap-2">
          {data.members.map((member) => {
            const isAdmin = member.role === "admin";
            const isSelf = member.id === user?.id;

            return (
              <li key={member.id} className="surface flex flex-wrap items-center gap-3 p-4">
                <div className="min-w-0 flex-1">
                  <p>
                    {displayName(member, member.id.slice(0, 8))}
                    {isAdmin ? (
                      <span className="badge ml-2 bg-accent-soft text-accent-ink">admin</span>
                    ) : null}
                  </p>
                  <p className="text-xs text-ink-faint">
                    {[member.promo, member.campus].filter(Boolean).join(" · ") || "—"}
                  </p>
                </div>

                {/* An admin cannot demote themselves, so the platform is never
                    left with nobody able to moderate. */}
                {isSelf ? (
                  <span className="text-xs text-ink-faint">—</span>
                ) : (
                  <button
                    type="button"
                    className="btn btn-secondary h-9 min-h-0 px-3 text-sm"
                    disabled={busy}
                    onClick={() =>
                      run(
                        () => setUserRole(member.id, isAdmin ? "student" : "admin"),
                        "admin.roleUpdated",
                      )
                    }
                  >
                    {isAdmin ? t("admin.demote") : t("admin.promote")}
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      </section>

      <p className="mt-12 text-sm">
        <Link href="/ideas/" className="text-ink-faint underline underline-offset-4 hover:text-ink">
          {t("common.back")}
        </Link>
      </p>
    </div>
  );
}

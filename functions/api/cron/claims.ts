import { isAuthorisedCron, json, type Env } from "../../_lib/http";
import { rpc } from "../../_lib/supabase";
import { recipientsFor, send } from "../../_lib/email";
import {
  claimExpiredForAuthor,
  claimExpiredForBuilder,
  claimReminder,
  voteMilestone,
} from "../../_lib/email-templates";

interface ExpiredRow {
  claim_id: string;
  idea_id: string;
  idea_title: string;
  builder_id: string;
  author_id: string;
}

interface MilestoneRow {
  idea_id: string;
  idea_title: string;
  author_id: string;
  milestone: number;
}

interface ReminderRow {
  claim_id: string;
  idea_id: string;
  idea_title: string;
  builder_id: string;
  stage: number;
  expires_at: string;
}

function daysUntil(iso: string): number {
  return Math.max(0, Math.ceil((new Date(iso).getTime() - Date.now()) / 86_400_000));
}

/**
 * Daily job. Expires overdue reservations, reopens their ideas, sends the two
 * reminders, and tells authors when their idea crosses a vote threshold.
 *
 * Both database functions mutate and return their rows in a single statement,
 * so a repeated or concurrent run finds nothing left to claim and sends
 * nothing. Calling this endpoint twice is safe by construction, not by luck.
 */
export const onRequest: PagesFunction<Env> = async ({ request, env }) => {
  if (!isAuthorisedCron(request, env)) return json({ error: "unauthorized" }, 401);

  try {
    const [expired, reminders, milestones] = await Promise.all([
      rpc<ExpiredRow[]>(env, "expire_due_claims"),
      rpc<ReminderRow[]>(env, "claim_reminders_due"),
      rpc<MilestoneRow[]>(env, "vote_milestones_due"),
    ]);

    for (const row of expired) {
      const people = await recipientsFor(env, [row.builder_id, row.author_id]);

      const builder = people.get(row.builder_id);
      if (builder) {
        await send(env, builder, claimExpiredForBuilder(row.idea_title), `/idea/?id=${row.idea_id}`);
      }

      const author = people.get(row.author_id);
      if (author && row.author_id !== row.builder_id) {
        await send(env, author, claimExpiredForAuthor(row.idea_title), `/idea/?id=${row.idea_id}`);
      }
    }

    for (const row of reminders) {
      const builder = (await recipientsFor(env, [row.builder_id])).get(row.builder_id);
      if (builder) {
        await send(
          env,
          builder,
          claimReminder(row.idea_title, row.expires_at, daysUntil(row.expires_at)),
          "/me/",
        );
      }
    }

    for (const row of milestones) {
      const author = (await recipientsFor(env, [row.author_id])).get(row.author_id);
      if (author) {
        await send(
          env,
          author,
          voteMilestone(row.idea_title, row.milestone),
          `/idea/?id=${row.idea_id}`,
        );
      }
    }

    return json({
      expired: expired.length,
      reminded: reminders.length,
      milestones: milestones.length,
      at: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[cron/claims] failed", error);
    return json({ error: "failed" }, 500);
  }
};

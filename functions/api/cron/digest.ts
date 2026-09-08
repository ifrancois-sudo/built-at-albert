import { isAuthorisedCron, json, type Env } from "../../_lib/http";
import { select } from "../../_lib/supabase";
import { recipientsFor, send } from "../../_lib/email";
import { weeklyDigest } from "../../_lib/email-templates";

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * Weekly summary of what moved. Sent to every confirmed member.
 *
 * There is no per-recipient unsubscribe in v1, which is acceptable for one
 * internal email a week and is the first thing to add if anyone asks.
 */
export const onRequest: PagesFunction<Env> = async ({ request, env }) => {
  if (!isAuthorisedCron(request, env)) return json({ error: "unauthorized" }, 401);

  try {
    const since = new Date(Date.now() - WEEK_MS).toISOString();

    const [opened, delivered, endedClaims] = await Promise.all([
      select<{ title: string }>(
        env,
        `ideas?select=title&status=eq.open&published_at=gte.${since}&limit=12`,
      ),
      select<{ title: string }>(
        env,
        `ideas?select=title&status=eq.delivered&published_at=gte.${since}&limit=12`,
      ),
      select<{ idea_id: string }>(
        env,
        `claims?select=idea_id&status=in.(expired,released)&ended_at=gte.${since}&limit=12`,
      ),
    ]);

    const releasedTitles =
      endedClaims.length > 0
        ? await select<{ title: string }>(
            env,
            `ideas?select=title&status=eq.open&id=in.(${endedClaims.map((claim) => claim.idea_id).join(",")})`,
          )
        : [];

    const newIdeas = opened.map((idea) => idea.title);
    const shipped = delivered.map((idea) => idea.title);
    const released = releasedTitles.map((idea) => idea.title);

    // Nothing happened, so nothing is sent. A weekly email that says "no news"
    // teaches people to ignore the sender.
    if (newIdeas.length + shipped.length + released.length === 0) {
      return json({ sent: 0, reason: "no_activity" });
    }

    const members = await select<{ id: string }>(env, "profiles?select=id");
    const recipients = await recipientsFor(
      env,
      members.map((member) => member.id),
    );

    for (const recipient of recipients.values()) {
      await send(env, recipient, weeklyDigest(newIdeas, released, shipped), "/ideas/");
    }

    return json({ sent: recipients.size, at: new Date().toISOString() });
  } catch (error) {
    console.error("[cron/digest] failed", error);
    return json({ error: "failed" }, 500);
  }
};

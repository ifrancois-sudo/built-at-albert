import { json, readJson, type Env } from "../_lib/http";
import { select, userFromRequest } from "../_lib/supabase";
import { recipientsFor, send } from "../_lib/email";
import {
  claimConfirmed,
  ideaApproved,
  ideaClaimedForAuthor,
  ideaDeliveredForAuthor,
  ideaRejected,
} from "../_lib/email-templates";

type Event =
  | { type: "claim_created"; claimId: string }
  | { type: "idea_moderated"; ideaId: string }
  | { type: "project_delivered"; projectId: string };

interface IdeaRow {
  id: string;
  title: string;
  author_id: string;
  status: string;
  rejected_reason: string | null;
}

/**
 * Sends the transactional emails for something that just happened.
 *
 * The browser cannot hold the Resend key or read anyone's address, so it asks
 * here instead. Every event is re-read from the database with the service role
 * before a single message goes out, which means this endpoint cannot be used to
 * make the platform send mail about things that never occurred. The caller must
 * also present a confirmed session.
 */
export const onRequest: PagesFunction<Env> = async ({ request, env }) => {
  if (request.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  const caller = await userFromRequest(request, env);
  if (!caller) return json({ error: "unauthorized" }, 401);

  let event: Event;
  try {
    event = await readJson<Event>(request);
  } catch {
    return json({ error: "bad_request" }, 400);
  }

  try {
    if (event.type === "claim_created") {
      const [claim] = await select<{ id: string; idea_id: string; user_id: string; expires_at: string }>(
        env,
        `claims?select=id,idea_id,user_id,expires_at&id=eq.${event.claimId}&status=eq.active`,
      );
      // Only the holder of the claim can trigger its emails.
      if (!claim || claim.user_id !== caller.id) return json({ sent: 0 });

      const [idea] = await select<IdeaRow>(
        env,
        `ideas?select=id,title,author_id,status,rejected_reason&id=eq.${claim.idea_id}`,
      );
      if (!idea) return json({ sent: 0 });

      const people = await recipientsFor(env, [claim.user_id, idea.author_id]);
      const builder = people.get(claim.user_id);
      const author = people.get(idea.author_id);

      if (builder) await send(env, builder, claimConfirmed(idea.title, claim.expires_at), "/me/");
      if (author && author.id !== claim.user_id) {
        const [profile] = await select<{ full_name: string | null }>(
          env,
          `profiles?select=full_name&id=eq.${claim.user_id}`,
        );
        await send(
          env,
          author,
          ideaClaimedForAuthor(idea.title, profile?.full_name?.trim() || "Un élève"),
          `/idea/?id=${idea.id}`,
        );
      }

      return json({ sent: 1 });
    }

    if (event.type === "idea_moderated") {
      // Moderation mail is only sent for an idea that really has been decided,
      // and only at the request of an admin.
      const [profile] = await select<{ role: string }>(
        env,
        `profiles?select=role&id=eq.${caller.id}`,
      );
      if (profile?.role !== "admin") return json({ error: "forbidden" }, 403);

      const [idea] = await select<IdeaRow>(
        env,
        `ideas?select=id,title,author_id,status,rejected_reason&id=eq.${event.ideaId}`,
      );
      if (!idea || (idea.status !== "open" && idea.status !== "rejected")) return json({ sent: 0 });

      const author = (await recipientsFor(env, [idea.author_id])).get(idea.author_id);
      if (!author) return json({ sent: 0 });

      await send(
        env,
        author,
        idea.status === "open"
          ? ideaApproved(idea.title)
          : ideaRejected(idea.title, idea.rejected_reason ?? ""),
        idea.status === "open" ? `/idea/?id=${idea.id}` : "/ideas/new/",
      );

      return json({ sent: 1 });
    }

    if (event.type === "project_delivered") {
      const [project] = await select<{ id: string; idea_id: string; author_id: string }>(
        env,
        `projects?select=id,idea_id,author_id&id=eq.${event.projectId}`,
      );
      if (!project || project.author_id !== caller.id) return json({ sent: 0 });

      const [idea] = await select<IdeaRow>(
        env,
        `ideas?select=id,title,author_id,status,rejected_reason&id=eq.${project.idea_id}`,
      );
      if (!idea || idea.author_id === project.author_id) return json({ sent: 0 });

      const author = (await recipientsFor(env, [idea.author_id])).get(idea.author_id);
      if (!author) return json({ sent: 0 });

      await send(env, author, ideaDeliveredForAuthor(idea.title), `/idea/?id=${idea.id}`);
      return json({ sent: 1 });
    }

    return json({ error: "unknown_event" }, 400);
  } catch (error) {
    console.error("[notify] failed", error);
    return json({ error: "failed" }, 500);
  }
};

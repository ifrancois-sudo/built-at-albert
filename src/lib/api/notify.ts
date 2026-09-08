import { supabase } from "@/lib/supabase/client";

export type NotifyEvent =
  | { type: "claim_created"; claimId: string }
  | { type: "idea_moderated"; ideaId: string }
  | { type: "project_delivered"; projectId: string };

/**
 * Asks the Pages Function to send the emails for something that just happened.
 *
 * The function re-reads the event from the database with the service role before
 * sending anything, so this endpoint cannot be used to make the platform send
 * mail about events that did not occur. Failures are swallowed on purpose: an
 * email provider outage must not undo a state change the student already saw
 * succeed.
 */
export async function notify(event: NotifyEvent): Promise<void> {
  try {
    const {
      data: { session },
    } = await supabase().auth.getSession();
    if (!session) return;

    await fetch("/api/notify", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify(event),
    });
  } catch (error) {
    console.warn("[notify] skipped", error);
  }
}

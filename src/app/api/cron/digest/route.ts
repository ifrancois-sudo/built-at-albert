import { NextResponse } from "next/server";
import { createAdminSupabase } from "@/lib/supabase/admin";
import { isAuthorisedCron } from "@/lib/cron-auth";
import { sendWeeklyDigestEmail } from "@/lib/email";
import { DEFAULT_LOCALE, isLocale } from "@/i18n";

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

// Weekly summary of what moved. Sent to every confirmed member; there is no
// per-user unsubscribe in v1, which is acceptable for one internal email a week
// and is the first thing to add if anyone asks.
export async function POST(request: Request) {
  if (!isAuthorisedCron(request)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const supabase = createAdminSupabase();
  const since = new Date(Date.now() - WEEK_MS).toISOString();

  const [openedResult, deliveredResult, releasedResult, membersResult] = await Promise.all([
    supabase.from("ideas").select("title").eq("status", "open").gte("published_at", since).limit(12),
    supabase.from("ideas").select("title").eq("status", "delivered").gte("published_at", since).limit(12),
    supabase
      .from("claims")
      .select("idea_id")
      .in("status", ["expired", "released"])
      .gte("ended_at", since)
      .limit(12),
    supabase
      .from("profiles")
      .select("id, email, locale")
      .overrideTypes<{ id: string; email: string; locale: string }[]>(),
  ]);

  const releasedIdeaIds = (releasedResult.data ?? []).map((claim) => claim.idea_id);
  const releasedTitles =
    releasedIdeaIds.length > 0
      ? (
          await supabase.from("ideas").select("title").in("id", releasedIdeaIds).eq("status", "open")
        ).data ?? []
      : [];

  const newIdeas = (openedResult.data ?? []).map((idea) => idea.title);
  const delivered = (deliveredResult.data ?? []).map((idea) => idea.title);
  const released = releasedTitles.map((idea) => idea.title);

  // Nothing happened, so nothing is sent. A weekly email that says "no news"
  // teaches people to ignore the sender.
  if (newIdeas.length + delivered.length + released.length === 0) {
    return NextResponse.json({ sent: 0, reason: "no_activity" });
  }

  const members = membersResult.data ?? [];
  for (const member of members) {
    await sendWeeklyDigestEmail(
      { email: member.email, locale: isLocale(member.locale) ? member.locale : DEFAULT_LOCALE },
      newIdeas,
      released,
      delivered,
    );
  }

  return NextResponse.json({ sent: members.length, at: new Date().toISOString() });
}

import { NextResponse } from "next/server";
import { createAdminSupabase } from "@/lib/supabase/admin";
import { isAuthorisedCron } from "@/lib/cron-auth";
import { sendClaimExpiredEmails, sendClaimReminderEmail } from "@/lib/email";
import { daysUntil } from "@/lib/format";

// Called daily by the companion Worker in worker-cron/. Both database calls
// mutate and return rows in a single statement, so running this twice in a row
// finds nothing left to claim and sends no second email.
export async function POST(request: Request) {
  if (!isAuthorisedCron(request)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const supabase = createAdminSupabase();

  const [expired, reminders] = await Promise.all([
    supabase.rpc("expire_due_claims"),
    supabase.rpc("claim_reminders_due"),
  ]);

  if (expired.error || reminders.error) {
    console.error("[cron/claims] rpc failed", {
      expired: expired.error,
      reminders: reminders.error,
    });
    return NextResponse.json({ error: "rpc_failed" }, { status: 500 });
  }

  const expiredRows = expired.data ?? [];
  const reminderRows = reminders.data ?? [];

  for (const row of expiredRows) {
    await sendClaimExpiredEmails(row.builder_id, row.author_id, row.idea_id, row.idea_title);
  }

  for (const row of reminderRows) {
    await sendClaimReminderEmail(
      row.builder_id,
      row.idea_title,
      row.expires_at,
      daysUntil(row.expires_at),
    );
  }

  return NextResponse.json({
    expired: expiredRows.length,
    reminded: reminderRows.length,
    at: new Date().toISOString(),
  });
}

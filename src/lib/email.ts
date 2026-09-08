import "server-only";

import { Resend } from "resend";
import { serverEnv } from "@/lib/env";
import { createAdminSupabase } from "@/lib/supabase/admin";
import { DEFAULT_LOCALE, isLocale, type Locale } from "@/i18n";
import type { IdeaRow } from "@/lib/database.types";
import {
  claimConfirmed,
  claimExpiredForAuthor,
  claimExpiredForBuilder,
  claimReminder,
  ideaApproved,
  ideaClaimedForAuthor,
  ideaDeliveredForAuthor,
  ideaRejected,
  pickCopy,
  weeklyDigest,
  type EmailCopy,
} from "@/lib/email-templates";

interface Recipient {
  email: string;
  locale: Locale;
}

// profiles.email is hidden from every client session by a column grant, so
// resolving an address needs the service role.
export async function recipientsFor(userIds: string[]): Promise<Map<string, Recipient>> {
  const unique = Array.from(new Set(userIds.filter(Boolean)));
  if (unique.length === 0) return new Map();

  const { data } = await createAdminSupabase()
    .from("profiles")
    .select("id, email, locale")
    .in("id", unique)
    .overrideTypes<{ id: string; email: string; locale: string }[]>();

  return new Map(
    (data ?? []).map((row) => [
      row.id,
      { email: row.email, locale: isLocale(row.locale) ? row.locale : DEFAULT_LOCALE },
    ]),
  );
}

function siteUrl(): string {
  return serverEnv("NEXT_PUBLIC_SITE_URL") ?? "http://localhost:3000";
}

function renderHtml(copy: EmailCopy, ctaUrl: string): string {
  const paragraphs = copy.body
    .map(
      (line) =>
        `<p style="margin:0 0 12px;font-size:15px;line-height:1.6;color:#4b483f">${escapeHtml(line)}</p>`,
    )
    .join("");

  const cta = copy.ctaLabel
    ? `<p style="margin:24px 0 0"><a href="${ctaUrl}" style="display:inline-block;background:#3a2fd6;color:#ffffff;text-decoration:none;padding:12px 20px;border-radius:10px;font-size:15px;font-weight:500">${escapeHtml(copy.ctaLabel)}</a></p>`
    : "";

  return `<!doctype html><html><body style="margin:0;padding:24px;background:#faf8f4;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
<table role="presentation" width="100%" style="max-width:520px;background:#ffffff;border:1px solid #e2ded3;border-radius:14px" cellpadding="0" cellspacing="0"><tr><td style="padding:28px">
<p style="margin:0 0 4px;font-size:12px;letter-spacing:.06em;text-transform:uppercase;color:#7b776b">Built at Albert</p>
<h1 style="margin:0 0 16px;font-size:22px;line-height:1.25;color:#14130f;font-weight:600">${escapeHtml(copy.heading)}</h1>
${paragraphs}${cta}
</td></tr></table>
<p style="margin:16px 0 0;font-size:12px;color:#7b776b">Albert School — plateforme interne</p>
</td></tr></table></body></html>`;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// Sending is best-effort: an email provider outage must never roll back a
// state change the student already saw succeed in the UI.
async function send(to: string, copy: EmailCopy, path: string): Promise<void> {
  const apiKey = serverEnv("RESEND_API_KEY");
  const from = serverEnv("RESEND_FROM");

  if (!apiKey || !from) {
    console.warn(`[email] skipped "${copy.subject}" to ${to}: RESEND_API_KEY or RESEND_FROM unset`);
    return;
  }

  try {
    const replyTo = serverEnv("RESEND_REPLY_TO");
    await new Resend(apiKey).emails.send({
      from,
      to,
      subject: copy.subject,
      html: renderHtml(copy, new URL(path, siteUrl()).toString()),
      ...(replyTo ? { replyTo } : {}),
    });
  } catch (error) {
    console.error("[email] send failed", { to, subject: copy.subject, error });
  }
}

export async function sendIdeaModeratedEmail(idea: IdeaRow): Promise<void> {
  const recipient = (await recipientsFor([idea.author_id])).get(idea.author_id);
  if (!recipient) return;

  const copy =
    idea.status === "open"
      ? ideaApproved(idea.title)
      : ideaRejected(idea.title, idea.rejected_reason ?? "");

  await send(
    recipient.email,
    pickCopy(copy, recipient.locale),
    idea.status === "open" ? `/ideas/${idea.id}` : "/ideas/new",
  );
}

export async function sendClaimConfirmedEmail(
  builderId: string,
  ideaTitle: string,
  expiresAt: string,
): Promise<void> {
  const recipient = (await recipientsFor([builderId])).get(builderId);
  if (!recipient) return;
  await send(recipient.email, pickCopy(claimConfirmed(ideaTitle, expiresAt), recipient.locale), "/me");
}

export async function sendIdeaClaimedEmail(
  authorId: string,
  ideaId: string,
  ideaTitle: string,
  builderName: string,
): Promise<void> {
  const recipient = (await recipientsFor([authorId])).get(authorId);
  if (!recipient) return;
  await send(
    recipient.email,
    pickCopy(ideaClaimedForAuthor(ideaTitle, builderName), recipient.locale),
    `/ideas/${ideaId}`,
  );
}

export async function sendIdeaDeliveredEmail(
  authorId: string,
  ideaId: string,
  ideaTitle: string,
): Promise<void> {
  const recipient = (await recipientsFor([authorId])).get(authorId);
  if (!recipient) return;
  await send(
    recipient.email,
    pickCopy(ideaDeliveredForAuthor(ideaTitle), recipient.locale),
    `/ideas/${ideaId}`,
  );
}

export async function sendClaimReminderEmail(
  builderId: string,
  ideaTitle: string,
  expiresAt: string,
  daysLeft: number,
): Promise<void> {
  const recipient = (await recipientsFor([builderId])).get(builderId);
  if (!recipient) return;
  await send(
    recipient.email,
    pickCopy(claimReminder(ideaTitle, expiresAt, daysLeft), recipient.locale),
    "/me",
  );
}

export async function sendClaimExpiredEmails(
  builderId: string,
  authorId: string,
  ideaId: string,
  ideaTitle: string,
): Promise<void> {
  const recipients = await recipientsFor([builderId, authorId]);

  const builder = recipients.get(builderId);
  if (builder) {
    await send(
      builder.email,
      pickCopy(claimExpiredForBuilder(ideaTitle), builder.locale),
      `/ideas/${ideaId}`,
    );
  }

  const author = recipients.get(authorId);
  if (author && authorId !== builderId) {
    await send(
      author.email,
      pickCopy(claimExpiredForAuthor(ideaTitle), author.locale),
      `/ideas/${ideaId}`,
    );
  }
}

export async function sendWeeklyDigestEmail(
  recipient: Recipient,
  newIdeas: string[],
  releasedIdeas: string[],
  deliveredProjects: string[],
): Promise<void> {
  await send(
    recipient.email,
    pickCopy(weeklyDigest(newIdeas, releasedIdeas, deliveredProjects), recipient.locale),
    "/ideas",
  );
}

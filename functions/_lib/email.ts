import type { Env } from "./http";
import { select } from "./supabase";
import { pickCopy, type EmailCopy, type Locale } from "./email-templates";

export interface Recipient {
  id: string;
  email: string;
  locale: Locale;
}

// profiles.email is hidden from every client session by a column grant, so
// resolving an address is one of the reasons this code lives server side.
export async function recipientsFor(env: Env, userIds: string[]): Promise<Map<string, Recipient>> {
  const unique = Array.from(new Set(userIds.filter(Boolean)));
  if (unique.length === 0) return new Map();

  const rows = await select<{ id: string; email: string; locale: string }>(
    env,
    `profiles?select=id,email,locale&id=in.(${unique.join(",")})`,
  );

  return new Map(
    rows.map((row) => [
      row.id,
      { id: row.id, email: row.email, locale: row.locale === "en" ? "en" : "fr" },
    ]),
  );
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
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

/**
 * Sending is best-effort on purpose. An email provider outage must never undo a
 * state change the student already saw succeed in the interface.
 */
export async function send(
  env: Env,
  recipient: Recipient,
  copy: Record<Locale, EmailCopy>,
  path: string,
): Promise<void> {
  const chosen = pickCopy(copy, recipient.locale);

  if (!env.RESEND_API_KEY || !env.RESEND_FROM) {
    console.warn(`[email] skipped "${chosen.subject}": RESEND_API_KEY or RESEND_FROM unset`);
    return;
  }

  try {
    const ctaUrl = new URL(path, env.SITE_URL ?? "https://built-at-albert.pages.dev").toString();

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: env.RESEND_FROM,
        to: recipient.email,
        subject: chosen.subject,
        html: renderHtml(chosen, ctaUrl),
        ...(env.RESEND_REPLY_TO ? { reply_to: env.RESEND_REPLY_TO } : {}),
      }),
    });

    if (!response.ok) {
      console.error("[email] resend refused", response.status, await response.text());
    }
  } catch (error) {
    console.error("[email] send failed", error);
  }
}

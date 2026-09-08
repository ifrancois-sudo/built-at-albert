// Values that are public by design: the Supabase project URL and its
// publishable key ship to the browser anyway. Keeping them here rather than in
// a .env file means the Workers build never depends on build-time inlining.

export const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://sdrlrksfefswxtmnjfmx.supabase.co";

export const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "sb_publishable_qYE6EfbXOAF6PNArlxXZ7A__F1theHf";

export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const WHATSAPP_CHANNEL_URL =
  process.env.NEXT_PUBLIC_WHATSAPP_CHANNEL_URL ??
  "https://whatsapp.com/channel/0029Vb99R1UFXUuTnGJblY2H";

// Public: the sign-up form shows it, and the rule is enforced by a trigger on
// auth.users, so there is nothing to hide here.
export const ALLOWED_EMAIL_DOMAINS = (
  process.env.NEXT_PUBLIC_ALLOWED_EMAIL_DOMAINS ?? "albertschool.com"
)
  .split(",")
  .map((domain) => domain.trim().toLowerCase())
  .filter(Boolean);

export function isAllowedEmail(email: string): boolean {
  const normalised = email.trim().toLowerCase();
  const at = normalised.lastIndexOf("@");
  if (at < 1) return false;
  return ALLOWED_EMAIL_DOMAINS.includes(normalised.slice(at + 1));
}

export const CLAIM_DAYS = 21;
export const CLAIM_EXTENSION_DAYS = 14;
export const MAX_ACTIVE_CLAIMS = 2;

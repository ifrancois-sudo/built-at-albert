import { supabase } from "@/lib/supabase/client";
import type { ProfileRow } from "@/lib/database.types";

export const PROFILE_COLUMNS = "id, full_name, promo, campus, role, locale, created_at";

export type ProfileMap = Map<string, ProfileRow>;

// Names come from one extra round trip rather than a PostgREST embed. The email
// column is hidden by a column grant, and a flat lookup keeps the query types
// honest without hand-maintaining foreign-key metadata.
export async function fetchProfiles(ids: Iterable<string>): Promise<ProfileMap> {
  const unique = Array.from(new Set(Array.from(ids).filter(Boolean)));
  if (unique.length === 0) return new Map();

  const { data } = await supabase().from("profiles").select(PROFILE_COLUMNS).in("id", unique);
  return new Map((data ?? []).map((profile) => [profile.id, profile]));
}

export function displayName(profile: ProfileRow | undefined | null, fallback: string): string {
  const name = profile?.full_name?.trim();
  return name && name.length > 0 ? name : fallback;
}

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, ProfileRow } from "@/lib/database.types";

export type ProfileMap = Map<string, ProfileRow>;

// Names are fetched in one extra round trip rather than through a PostgREST
// embed. Column-level grants already hide the email, and a flat lookup keeps
// the query types honest without hand-maintaining foreign-key metadata.
export async function fetchProfiles(
  supabase: SupabaseClient<Database>,
  ids: Iterable<string>,
): Promise<ProfileMap> {
  const unique = Array.from(new Set(Array.from(ids).filter(Boolean)));
  if (unique.length === 0) return new Map();

  const { data } = await supabase
    .from("profiles")
    .select("id, full_name, promo, campus, role, locale, created_at")
    .in("id", unique);

  return new Map((data ?? []).map((profile) => [profile.id, profile]));
}

export function displayName(profile: ProfileRow | undefined, fallback: string): string {
  const name = profile?.full_name?.trim();
  return name && name.length > 0 ? name : fallback;
}

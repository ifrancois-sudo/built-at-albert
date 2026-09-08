import { redirect } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase/server";
import type { ProfileRow } from "@/lib/database.types";

export interface Viewer {
  id: string;
  email: string;
  verified: boolean;
  profile: ProfileRow;
  isAdmin: boolean;
}

// Returns null for signed-out or unverified visitors. Reading the profile also
// proves RLS lets this session through, so a caller never renders a page for an
// account the database would refuse to serve.
export async function getViewer(): Promise<Viewer | null> {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !user.email_confirmed_at) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, full_name, promo, campus, role, locale, created_at")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile) return null;

  return {
    id: user.id,
    email: user.email ?? "",
    verified: true,
    profile,
    isAdmin: profile.role === "admin",
  };
}

export async function requireViewer(): Promise<Viewer> {
  const viewer = await getViewer();
  if (!viewer) redirect("/login");
  return viewer;
}

export async function requireAdmin(): Promise<Viewer> {
  const viewer = await requireViewer();
  if (!viewer.isAdmin) redirect("/ideas");
  return viewer;
}

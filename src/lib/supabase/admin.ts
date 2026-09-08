import "server-only";

import { createClient } from "@supabase/supabase-js";
import { SUPABASE_URL } from "@/lib/public-config";
import { requireServerEnv } from "@/lib/env";
import type { Database } from "@/lib/database.types";

// Bypasses RLS. Only for the cron route and admin-side maintenance; never
// import this from anything that renders in the browser.
export function createAdminSupabase() {
  return createClient<Database>(SUPABASE_URL, requireServerEnv("SUPABASE_SERVICE_ROLE_KEY"), {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

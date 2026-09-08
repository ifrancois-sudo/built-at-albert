"use client";

import { createClient } from "@supabase/supabase-js";
import { SUPABASE_ANON_KEY, SUPABASE_URL } from "@/lib/public-config";
import type { Database } from "@/lib/database.types";

// One client for the whole tab. A second one would start its own token-refresh
// timer and the two would race each other over the same storage.
//
// There is no server rendering any more, so the session lives in the browser
// and never needs to be readable as a cookie. The Pages Functions receive the
// access token in an Authorization header instead.
let instance: ReturnType<typeof createClient<Database>> | null = null;

export function supabase() {
  instance ??= createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false,
    },
  });
  return instance;
}

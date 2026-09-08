"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase/client";
import type { ProfileRow } from "@/lib/database.types";

export interface SessionValue {
  loading: boolean;
  user: User | null;
  profile: ProfileRow | null;
  /** Signed in and the email address is confirmed. */
  verified: boolean;
  isAdmin: boolean;
  reload: () => Promise<void>;
}

const SessionContext = createContext<SessionValue | null>(null);

const PROFILE_COLUMNS = "id, full_name, promo, campus, role, locale, created_at";

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<ProfileRow | null>(null);

  const loadProfile = useCallback(async (current: User | null) => {
    if (!current?.email_confirmed_at) {
      setProfile(null);
      return;
    }

    // RLS returns nothing here for an unverified account, so a successful read
    // is itself proof the session is allowed to see data.
    const { data } = await supabase()
      .from("profiles")
      .select(PROFILE_COLUMNS)
      .eq("id", current.id)
      .maybeSingle();

    setProfile(data ?? null);
  }, []);

  const apply = useCallback(
    async (session: Session | null) => {
      setUser(session?.user ?? null);
      await loadProfile(session?.user ?? null);
      setLoading(false);
    },
    [loadProfile],
  );

  useEffect(() => {
    let active = true;

    supabase()
      .auth.getSession()
      .then(({ data }) => {
        if (active) void apply(data.session);
      });

    const { data: subscription } = supabase().auth.onAuthStateChange((_event, session) => {
      if (active) void apply(session);
    });

    return () => {
      active = false;
      subscription.subscription.unsubscribe();
    };
  }, [apply]);

  const reload = useCallback(async () => {
    const { data } = await supabase().auth.getSession();
    await apply(data.session);
  }, [apply]);

  const value = useMemo<SessionValue>(
    () => ({
      loading,
      user,
      profile,
      verified: Boolean(user?.email_confirmed_at),
      isAdmin: profile?.role === "admin",
      reload,
    }),
    [loading, user, profile, reload],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionValue {
  const value = useContext(SessionContext);
  if (!value) throw new Error("useSession must be used inside a SessionProvider");
  return value;
}

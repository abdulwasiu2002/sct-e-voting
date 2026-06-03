import { useCallback, useEffect, useState } from "react";
import { supabase } from "../services/supabaseClient";
import { fetchProfile } from "../services/supabaseService";
import type { SessionUser } from "../types";

export const useAuth = () => {
  const [session, setSession] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadProfile = useCallback(async (authUserId: string | null) => {
    if (!authUserId) {
      setSession(null);
      return;
    }

    const result = await fetchProfile(authUserId);
    if (result.error) {
      setError(result.error);
      setSession(null);
      return;
    }
    setSession(result.data);
  }, []);

  const refreshAuth = useCallback(async () => {
    if (!supabase) {
      setError("Supabase is not configured.");
      setLoading(false);
      return;
    }

    const { data, error } = await supabase.auth.getSession();
    if (error) {
      setError(error.message);
      setSession(null);
      setLoading(false);
      return;
    }

    await loadProfile(data.session?.user.id ?? null);
    setLoading(false);
  }, [loadProfile]);

  useEffect(() => {
    refreshAuth();
    if (!supabase) return;
    const { data: listener } = supabase.auth.onAuthStateChange((_, authSession) => {
      if (authSession?.user?.id) {
        void loadProfile(authSession.user.id);
      } else {
        setSession(null);
      }
    });
    return () => {
      listener?.subscription.unsubscribe();
    };
  }, [refreshAuth, loadProfile]);

  return { session, loading, error, refreshAuth };
};

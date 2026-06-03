import { useCallback, useEffect, useState } from "react";
import { isSupabaseConfigured, supabase } from "../services/supabaseClient";
import { fetchProfile, getLocalAdminSession } from "../services/supabaseService";
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
    if (!isSupabaseConfigured || !supabase) {
      const localAdmin = getLocalAdminSession();
      if (localAdmin) {
        setSession(localAdmin);
        setLoading(false);
        return;
      }

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

    const authUserId = data.session?.user.id ?? null;
    if (authUserId) {
      await loadProfile(authUserId);
      setLoading(false);
      return;
    }

    const localAdmin = getLocalAdminSession();
    if (localAdmin) {
      setSession(localAdmin);
      setLoading(false);
      return;
    }

    setSession(null);
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

  useEffect(() => {
    const handleLocalAdminSignIn = () => {
      const localAdmin = getLocalAdminSession();
      if (localAdmin) setSession(localAdmin);
    };
    const handleLocalAdminSignOut = () => {
      setSession(null);
    };

    if (typeof window === "undefined") return;
    window.addEventListener("sct-voting-local-admin-signin", handleLocalAdminSignIn);
    window.addEventListener("sct-voting-local-admin-signout", handleLocalAdminSignOut);

    return () => {
      window.removeEventListener("sct-voting-local-admin-signin", handleLocalAdminSignIn);
      window.removeEventListener("sct-voting-local-admin-signout", handleLocalAdminSignOut);
    };
  }, []);

  return { session, loading, error, refreshAuth };
};

import { useCallback, useEffect, useState } from "react";
import { fetchAppState } from "../services/supabaseService";
import type { DbState } from "../types";

export const useAppState = () => {
  const [state, setState] = useState<DbState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshState = useCallback(async () => {
    setLoading(true);
    const result = await fetchAppState();
    setState(result.data);
    setError(result.error);
    setLoading(false);
    return result;
  }, []);

  useEffect(() => {
    void refreshState();
  }, [refreshState]);

  return { state, loading, error, refreshState };
};

import { useEffect, useState } from "react";
import { mockDb } from "../services/mockDb";
import type { DbState, SessionUser } from "../types";

export const useDb = () => {
  const [state, setState] = useState<DbState>(() => mockDb.getState());

  useEffect(() => mockDb.subscribe(setState), []);

  return state;
};

export const useSession = () => {
  const [session, setSessionState] = useState<SessionUser | null>(() => mockDb.getSession());

  const setSession = (next: SessionUser | null) => {
    mockDb.setSession(next);
    setSessionState(next);
  };

  return { session, setSession };
};

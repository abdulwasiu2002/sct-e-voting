import type { DbState } from "../types";
import { isSupabaseConfigured, supabase } from "./supabaseClient";

const STATE_ID = "default";

export const cloudState = {
  async load(): Promise<DbState | null> {
    if (!isSupabaseConfigured || !supabase) return null;
    const { data, error } = await supabase.from("app_state").select("state").eq("id", STATE_ID).maybeSingle();
    if (error) {
      console.warn("Supabase state load failed:", error.message);
      return null;
    }
    return (data?.state as DbState | undefined) ?? null;
  },
  async save(state: DbState) {
    if (!isSupabaseConfigured || !supabase) return;
    const { error } = await supabase.from("app_state").upsert({
      id: STATE_ID,
      state,
      updated_at: new Date().toISOString(),
    });
    if (error) console.warn("Supabase state save failed:", error.message);
  },
  subscribe(onState: (state: DbState) => void) {
    if (!isSupabaseConfigured || !supabase) return () => undefined;
    const client = supabase;
    const channel = client
      .channel("app_state_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "app_state", filter: `id=eq.${STATE_ID}` },
        (payload) => {
          const next = payload.new as { state?: DbState };
          if (next.state) onState(next.state);
        },
      )
      .subscribe();

    return () => {
      void client.removeChannel(channel);
    };
  },
};

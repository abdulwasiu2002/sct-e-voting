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

    const updated_at = new Date().toISOString();
    const records = [
      ...state.users.map((item) => ({ id: item.id, kind: "user", matric_number: item.matricNumber ?? null, data: item, updated_at })),
      ...state.aspirants.map((item) => ({ id: item.id, kind: "aspirant", matric_number: item.matricNumber, data: item, updated_at })),
      ...state.candidates.map((item) => ({ id: item.id, kind: "candidate", matric_number: item.matricNumber ?? null, data: item, updated_at })),
      ...state.positions.map((item) => ({ id: item.id, kind: "position", matric_number: null, data: item, updated_at })),
      ...state.votes.map((item) => ({ id: item.id, kind: "vote", matric_number: null, data: item, updated_at })),
    ];
    const { error: recordsError } = await supabase.from("app_records").upsert(records);
    if (recordsError) console.warn("Supabase record mirror failed:", recordsError.message);
    if (!recordsError && records.length) {
      const ids = records.map((record) => record.id);
      const { error: cleanupError } = await supabase.from("app_records").delete().not("id", "in", `(${ids.map((id) => `"${id}"`).join(",")})`);
      if (cleanupError) console.warn("Supabase record cleanup failed:", cleanupError.message);
    }
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

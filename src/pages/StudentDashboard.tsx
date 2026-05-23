import { CheckCircle2, Clock, Lock, Send, Vote } from "lucide-react";
import type { ReactNode } from "react";
import { FormEvent, useMemo, useState } from "react";
import { EmptyState } from "../components/Layout";
import { useDb } from "../hooks/useDb";
import { mockDb } from "../services/mockDb";
import type { SessionUser } from "../types";
import { isElectionActive } from "../utils/election";

export const StudentDashboard = ({ session }: { session: SessionUser }) => {
  const state = useDb();
  const user = state.users.find((item) => item.id === session.id);
  const [selections, setSelections] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const positions = state.positions.filter((position) => position.isActive);
  const grouped = useMemo(
    () =>
      positions.map((position) => ({
        position,
        candidates: state.candidates.filter((candidate) => candidate.isActive && candidate.positionId === position.id),
      })),
    [positions, state.candidates],
  );

  const submit = (event: FormEvent) => {
    event.preventDefault();
    setError("");
    const missing = grouped.filter((group) => group.candidates.length && !selections[group.position.id]);
    if (missing.length) {
      setError("Please choose one candidate for every available position.");
      return;
    }
    try {
      mockDb.castVotes(session, selections);
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to submit ballot.");
    }
  };

  if (!isElectionActive(state)) {
    const starts = new Date(state.settings.startAt);
    const ends = new Date(state.settings.endAt);
    const isFuture = new Date() < starts;
    return (
      <StatusScreen
        icon={<Clock className="h-8 w-8" />}
        title={isFuture ? "Voting has not started" : "Voting is closed"}
        body={`The portal is ${state.settings.portalEnabled ? "enabled" : "disabled"}. Election window: ${starts.toLocaleString()} to ${ends.toLocaleString()}.`}
      />
    );
  }

  if (user?.hasVoted || submitted) {
    return (
      <StatusScreen
        icon={<CheckCircle2 className="h-8 w-8" />}
        title="Thank you for voting"
        body={`Receipt: ${session.id.slice(-8).toUpperCase()}-${new Date().getFullYear()}. Your account is locked from submitting another ballot.`}
      />
    );
  }

  if (user?.status !== "approved") {
    return <StatusScreen icon={<Lock className="h-8 w-8" />} title="Account not approved" body="Only approved SCT student voters can access the ballot." />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">Student ballot</p>
          <h1 className="mt-1 text-3xl font-black text-slate-950">Welcome, {session.fullName}</h1>
          <p className="mt-2 text-sm text-slate-600">Select one candidate under each position and submit once.</p>
        </div>
        <div className="rounded-xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white">
          <Vote className="mr-2 inline h-4 w-4 text-emerald-300" />
          {session.department}
        </div>
      </div>
      <form className="space-y-5" onSubmit={submit}>
        {grouped.map(({ position, candidates }) => (
          <section key={position.id} className="glass rounded-2xl p-5">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-xl font-bold text-slate-950">{position.title}</h2>
              <span className="text-sm font-medium text-slate-500">Choose one</span>
            </div>
            {candidates.length ? (
              <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {candidates.map((candidate) => {
                  const selected = selections[position.id] === candidate.id;
                  return (
                    <label
                      key={candidate.id}
                      className={`cursor-pointer rounded-xl border p-4 transition hover:-translate-y-0.5 hover:shadow-lg ${
                        selected ? "border-emerald-600 bg-emerald-50" : "border-slate-200 bg-white/80"
                      }`}
                    >
                      <input
                        className="sr-only"
                        type="radio"
                        name={position.id}
                        value={candidate.id}
                        checked={selected}
                        onChange={() => setSelections({ ...selections, [position.id]: candidate.id })}
                      />
                      <div className="flex items-start gap-3">
                        <img src={candidate.photo || `https://placehold.co/96x96/e2e8f0/334155?text=${encodeURIComponent(candidate.fullName.slice(0, 1))}`} alt="" className="h-16 w-16 rounded-xl object-cover" />
                        <div className="min-w-0">
                          <p className="font-bold text-slate-950">{candidate.fullName}</p>
                          <p className="text-xs font-medium text-slate-500">{candidate.department}</p>
                        </div>
                      </div>
                      <p className="mt-4 line-clamp-4 text-sm leading-6 text-slate-600">{candidate.manifesto}</p>
                    </label>
                  );
                })}
              </div>
            ) : (
              <div className="mt-4">
                <EmptyState title="No active candidates" body="This position has no approved candidates yet." />
              </div>
            )}
          </section>
        ))}
        {error ? <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700">{error}</p> : null}
        <button className="btn-primary w-full sm:w-auto" type="submit">
          <Send className="h-4 w-4" /> Submit ballot securely
        </button>
      </form>
    </div>
  );
};

const StatusScreen = ({ icon, title, body }: { icon: ReactNode; title: string; body: string }) => (
  <div className="mx-auto max-w-2xl">
    <div className="glass rounded-2xl p-8 text-center">
      <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-slate-950 text-emerald-300">{icon}</div>
      <h1 className="mt-6 text-3xl font-black text-slate-950">{title}</h1>
      <p className="mt-3 text-slate-600">{body}</p>
    </div>
  </div>
);

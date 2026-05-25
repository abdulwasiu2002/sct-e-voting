import { Download, ReceiptText, Upload, Vote } from "lucide-react";
import { FormEvent, useState } from "react";
import { Field } from "../components/Layout";
import { useDb } from "../hooks/useDb";
import { mockDb } from "../services/mockDb";
import type { SessionUser } from "../types";
import { readFileAsDataUrl } from "../utils/files";
import { exportAspirantFormPdf } from "../utils/reports";
import { voteCountForCandidate } from "../utils/election";

export const AspirantDashboard = ({ session }: { session: SessionUser }) => {
  const state = useDb();
  const aspirant = state.aspirants.find((item) => item.id === session.id);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  if (!aspirant) {
    return (
      <div className="glass rounded-2xl p-8 text-center">
        <h1 className="text-2xl font-bold text-slate-950">Aspirant profile not found</h1>
        <p className="mt-2 text-slate-600">Please contact the election administrator.</p>
      </div>
    );
  }

  const position = state.positions.find((item) => item.id === aspirant.positionId);
  const candidate = state.candidates.find((item) => item.aspirantId === aspirant.id);
  const voteCount = candidate ? voteCountForCandidate(state, candidate.id) : 0;
  const paymentReady = Boolean(state.settings.paymentBankName && state.settings.paymentAccountName && state.settings.paymentAccountNumber);

  const submitReceipt = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setDone(false);
    const form = new FormData(event.currentTarget);
    try {
      const receipt = await readFileAsDataUrl(form.get("receipt") as File, { accept: ["image/*", "application/pdf"], label: "payment receipt" });
      mockDb.submitAspirantPayment(aspirant.id, receipt);
      setDone(true);
      event.currentTarget.reset();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to submit receipt.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">Aspirant portal</p>
          <h1 className="mt-1 text-3xl font-black text-slate-950">Welcome, {aspirant.fullName}</h1>
          <p className="mt-2 text-sm text-slate-600">{position?.title ?? "Position not selected"} application</p>
        </div>
        <button className="btn-primary" onClick={() => exportAspirantFormPdf(state, aspirant)}>
          <Download className="h-4 w-4" /> Download form
        </button>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="glass rounded-2xl p-5">
          <p className="text-sm font-semibold text-slate-500">Application status</p>
          <p className="mt-3 text-2xl font-black capitalize text-slate-950">{aspirant.status}</p>
          <p className="mt-1 text-sm text-slate-500">Admin approval is required before payment processing.</p>
        </div>
        <div className="glass rounded-2xl p-5">
          <p className="text-sm font-semibold text-slate-500">Payment status</p>
          <p className="mt-3 text-2xl font-black capitalize text-slate-950">{aspirant.paymentStatus}</p>
          <p className="mt-1 text-sm text-slate-500">{aspirant.paymentReceipt ? "Receipt submitted for admin review." : "Receipt not submitted yet."}</p>
        </div>
        <div className="glass rounded-2xl p-5">
          <p className="text-sm font-semibold text-slate-500">Your votes</p>
          <p className="mt-3 text-4xl font-black text-slate-950">{voteCount}</p>
          <p className="mt-1 text-sm text-slate-500">{candidate ? "Live votes recorded for your candidate profile." : "You will see votes after promotion to candidate."}</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="glass rounded-2xl p-5">
          <div className="mb-5 flex items-center gap-2">
            <ReceiptText className="h-5 w-5 text-emerald-700" />
            <h2 className="text-xl font-bold text-slate-950">Form payment</h2>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white/80 p-4">
            <p className="text-sm font-semibold text-slate-500">Amount</p>
            <p className="mt-1 text-2xl font-black text-slate-950">NGN {(position?.formPrice ?? 0).toLocaleString()}</p>
          </div>
          {paymentReady ? (
            <div className="mt-4 space-y-3 rounded-xl bg-slate-950 p-4 text-white">
              <p className="text-sm font-semibold uppercase tracking-wide text-emerald-300">Pay into this account</p>
              <p className="text-lg font-bold">{state.settings.paymentBankName}</p>
              <p className="text-sm text-slate-300">{state.settings.paymentAccountName}</p>
              <p className="text-2xl font-black tracking-wide">{state.settings.paymentAccountNumber}</p>
            </div>
          ) : (
            <p className="mt-4 rounded-xl bg-amber-50 p-4 text-sm font-semibold text-amber-800">Payment account has not been configured by the admin.</p>
          )}
        </div>

        <form className="glass rounded-2xl p-5" onSubmit={submitReceipt}>
          <h2 className="text-xl font-bold text-slate-950">I have made the payment</h2>
          <p className="mt-1 text-sm text-slate-500">Upload your payment receipt for admin verification.</p>
          <div className="mt-5">
            <Field label="Payment receipt">
              <span className="flex items-center gap-2 rounded-lg border border-dashed border-slate-300 bg-white/80 px-3 py-2.5 text-sm text-slate-600">
                <Upload className="h-4 w-4" />
                <input name="receipt" type="file" accept="image/*,application/pdf" className="min-w-0 text-xs" required />
              </span>
            </Field>
          </div>
          {done ? <p className="mt-4 rounded-lg bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700">Receipt submitted. Admin will verify it.</p> : null}
          {error ? <p className="mt-4 rounded-lg bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700">{error}</p> : null}
          <button className="btn-primary mt-5" type="submit" disabled={!paymentReady}>
            <Vote className="h-4 w-4" /> Submit payment receipt
          </button>
        </form>
      </div>
    </div>
  );
};

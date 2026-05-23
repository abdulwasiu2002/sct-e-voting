import { BadgeDollarSign, Upload } from "lucide-react";
import { FormEvent, useState } from "react";
import { Link } from "react-router-dom";
import { Field } from "../components/Layout";
import { useDb } from "../hooks/useDb";
import { mockDb } from "../services/mockDb";
import { readImageAsDataUrl } from "../utils/files";

export const RegisterAspirant = () => {
  const state = useDb();
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const [positionId, setPositionId] = useState(state.positions[0]?.id ?? "");
  const selectedPosition = state.positions.find((position) => position.id === positionId);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    const form = new FormData(event.currentTarget);
    try {
      const passportImage = await readImageAsDataUrl(form.get("passport") as File);
      mockDb.registerAspirant({
        fullName: String(form.get("fullName")),
        matricNumber: String(form.get("matricNumber")),
        department: String(form.get("department")),
        level: String(form.get("level")),
        password: String(form.get("password")),
        positionId: String(form.get("positionId")),
        manifesto: String(form.get("manifesto")),
        passportImage,
      });
      setDone(true);
      event.currentTarget.reset();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Application failed.");
    }
  };

  return (
    <div className="mx-auto max-w-4xl">
      <div className="glass rounded-2xl p-6 sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-950">Aspirant registration</h1>
            <p className="mt-2 text-sm text-slate-600">Applications require payment verification before promotion to official candidate status.</p>
          </div>
          <div className="rounded-lg bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">
            <BadgeDollarSign className="mr-1 inline h-4 w-4" />
            Form fee: ₦{(selectedPosition?.formPrice ?? 0).toLocaleString()}
          </div>
        </div>
        {done ? (
          <div className="mt-6 rounded-xl bg-emerald-50 p-5 text-emerald-900">
            <p className="font-bold">Application submitted.</p>
            <p className="mt-1 text-sm">Payment status is pending until the election administrator verifies it.</p>
            <Link to="/login" className="mt-4 inline-flex text-sm font-bold text-emerald-800">
              Return to login
            </Link>
          </div>
        ) : null}
        <form className="mt-6 grid gap-4 sm:grid-cols-2" onSubmit={submit}>
          <Field label="Full name">
            <input name="fullName" className="input" required />
          </Field>
          <Field label="Matric number">
            <input name="matricNumber" className="input" required />
          </Field>
          <Field label="Department">
            <select name="department" className="input" required>
              {state.settings.departments.map((department) => (
                <option key={department}>{department}</option>
              ))}
            </select>
          </Field>
          <Field label="Level">
            <select name="level" className="input" required>
              {["200", "300", "400", "500"].map((level) => (
                <option key={level}>{level}</option>
              ))}
            </select>
          </Field>
          <Field label="Position applied for">
            <select name="positionId" className="input" value={positionId} onChange={(event) => setPositionId(event.target.value)} required>
              {state.positions.filter((position) => position.isActive).map((position) => (
                <option key={position.id} value={position.id}>
                  {position.title}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Password">
            <input name="password" type="password" minLength={6} className="input" required />
          </Field>
          <Field label="Passport photograph">
            <span className="flex items-center gap-2 rounded-lg border border-dashed border-slate-300 bg-white/80 px-3 py-2.5 text-sm text-slate-600">
              <Upload className="h-4 w-4" />
              <input name="passport" type="file" accept="image/*" className="min-w-0 text-xs" required />
            </span>
          </Field>
          <Field label="Manifesto">
            <textarea name="manifesto" className="input min-h-28" required />
          </Field>
          {error ? <p className="sm:col-span-2 rounded-lg bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700">{error}</p> : null}
          <button className="btn-primary sm:col-span-2" type="submit">
            Submit aspirant application
          </button>
        </form>
      </div>
    </div>
  );
};

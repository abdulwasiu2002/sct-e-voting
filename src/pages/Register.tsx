import { Upload, UserPlus } from "lucide-react";
import { FormEvent, useState } from "react";
import { Link } from "react-router-dom";
import { Field } from "../components/Layout";
import { mockDb } from "../services/mockDb";
import { readImageAsDataUrl } from "../utils/files";
import { useDb } from "../hooks/useDb";

export const Register = () => {
  const state = useDb();
  const levels = state.settings.levels?.length ? state.settings.levels : ["100", "200", "300", "400", "500"];
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    const form = new FormData(event.currentTarget);
    try {
      const idCardImage = await readImageAsDataUrl(form.get("idCard") as File);
      mockDb.registerStudent({
        fullName: String(form.get("fullName")),
        matricNumber: String(form.get("matricNumber")),
        department: String(form.get("department")),
        level: String(form.get("level")),
        password: String(form.get("password")),
        idCardImage,
      });
      setDone(true);
      event.currentTarget.reset();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed.");
    }
  };

  return (
    <div className="mx-auto max-w-3xl">
      <div className="glass rounded-2xl p-6 sm:p-8">
        <h1 className="text-2xl font-bold text-slate-950">Student registration</h1>
        <p className="mt-2 text-sm text-slate-600">Submitted accounts remain pending until reviewed by the SCT election administrator.</p>
        {done ? (
          <div className="mt-6 rounded-xl bg-emerald-50 p-5 text-emerald-900">
            <p className="font-bold">Registration submitted.</p>
            <p className="mt-1 text-sm">Your account is awaiting admin approval before you can vote.</p>
            <Link to="/login" className="mt-4 inline-flex text-sm font-bold text-emerald-800">
              Go to login
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
              {levels.map((level) => (
                <option key={level}>{level}</option>
              ))}
            </select>
          </Field>
          <Field label="Password">
            <input name="password" type="password" minLength={6} className="input" required />
          </Field>
          <Field label="ID card image">
            <span className="flex items-center gap-2 rounded-lg border border-dashed border-slate-300 bg-white/80 px-3 py-2.5 text-sm text-slate-600">
              <Upload className="h-4 w-4" />
              <input name="idCard" type="file" accept="image/*" className="min-w-0 text-xs" required />
            </span>
          </Field>
          {error ? <p className="sm:col-span-2 rounded-lg bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700">{error}</p> : null}
          <button className="btn-primary sm:col-span-2" type="submit">
            <UserPlus className="h-4 w-4" /> Submit registration
          </button>
        </form>
      </div>
    </div>
  );
};

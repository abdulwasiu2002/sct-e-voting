import { LogIn } from "lucide-react";
import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Field } from "../components/Layout";
import { mockDb } from "../services/mockDb";

export const Login = ({ refreshSession }: { refreshSession: () => void }) => {
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const result = mockDb.login(identifier, password);
    if (!result.ok || !result.user) {
      setError(result.message ?? "Unable to sign in.");
      return;
    }
    refreshSession();
    navigate(result.user.role === "admin" ? "/admin" : "/dashboard");
  };

  return (
    <div className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-[0.9fr_1.1fr]">
      <div className="glass rounded-2xl p-6">
        <h1 className="text-2xl font-bold text-slate-950">Secure login</h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Students sign in with matric number. Administrators use their admin identity.
        </p>
        <form className="mt-6 space-y-4" onSubmit={submit}>
          <Field label="Matric number or admin name">
            <input className="input" value={identifier} onChange={(event) => setIdentifier(event.target.value)} required />
          </Field>
          <Field label="Password">
            <input className="input" type="password" value={password} onChange={(event) => setPassword(event.target.value)} required />
          </Field>
          {error ? <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700">{error}</p> : null}
          <button className="btn-primary w-full" type="submit">
            <LogIn className="h-4 w-4" /> Login
          </button>
        </form>
      </div>
      <div className="rounded-2xl bg-slate-950 p-8 text-white">
        <p className="text-sm font-semibold uppercase tracking-wide text-emerald-300">Live election mode</p>
        <h2 className="mt-4 text-3xl font-black">Private SCT access only</h2>
        <p className="mt-4 max-w-xl text-sm leading-7 text-slate-300">
          Use your approved matric number or administrator identity to continue. Passwords and account credentials are never displayed on this portal.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link className="btn-secondary border-white/20 bg-white/10 text-white hover:bg-white/15" to="/register">
            Student registration
          </Link>
          <Link className="btn-secondary border-white/20 bg-white/10 text-white hover:bg-white/15" to="/register-aspirant">
            Aspirant registration
          </Link>
        </div>
      </div>
    </div>
  );
};

import { LogOut, ShieldCheck, Vote } from "lucide-react";
import type { ReactNode } from "react";
import { Link, Navigate, Outlet, useNavigate } from "react-router-dom";
import { mockDb } from "../services/mockDb";
import type { Role, SessionUser } from "../types";

export const Shell = ({ session }: { session: SessionUser | null }) => {
  const navigate = useNavigate();

  const logout = () => {
    mockDb.setSession(null);
    navigate("/login");
  };

  return (
    <div className="page-shell">
      <header className="sticky top-0 z-30 border-b border-white/70 bg-white/75 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          <Link to="/" className="flex min-w-0 items-center gap-3 text-slate-900">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-slate-900 text-white">
              <Vote className="h-5 w-5" />
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-bold uppercase tracking-wide text-slate-500">SCT</span>
              <span className="block truncate text-base font-bold">E-Voting Portal</span>
            </span>
          </Link>
          {session ? (
            <div className="flex items-center gap-2">
              <span className="hidden items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-800 sm:flex">
                <ShieldCheck className="h-4 w-4" />
                {session.fullName}
              </span>
              <button className="btn-secondary px-3" onClick={logout} aria-label="Log out">
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <Link to="/login" className="btn-secondary">
              Login
            </Link>
          )}
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Outlet />
      </main>
    </div>
  );
};

export const ProtectedRoute = ({ session, role }: { session: SessionUser | null; role: Role }) => {
  if (!session) return <Navigate to="/login" replace />;
  if (session.role !== role) return <Navigate to={session.role === "admin" ? "/admin" : "/dashboard"} replace />;
  return <Outlet />;
};

export const Field = ({
  label,
  children,
  hint,
}: {
  label: string;
  children: ReactNode;
  hint?: string;
}) => (
  <label className="block">
    <span className="mb-1.5 block text-sm font-semibold text-slate-700">{label}</span>
    {children}
    {hint ? <span className="mt-1 block text-xs text-slate-500">{hint}</span> : null}
  </label>
);

export const EmptyState = ({ title, body }: { title: string; body: string }) => (
  <div className="rounded-xl border border-dashed border-slate-300 bg-white/70 p-8 text-center">
    <p className="text-base font-semibold text-slate-900">{title}</p>
    <p className="mt-1 text-sm text-slate-500">{body}</p>
  </div>
);

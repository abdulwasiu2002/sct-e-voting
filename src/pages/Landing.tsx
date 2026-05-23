import { ArrowRight, BadgeCheck, BookOpen, LockKeyhole, UserPlus } from "lucide-react";
import { Link } from "react-router-dom";

export const Landing = () => (
  <div className="overflow-hidden">
    <section className="grid min-h-[calc(100vh-9rem)] items-center gap-10 py-8 lg:grid-cols-[1.05fr_0.95fr]">
      <div>
        <div className="mb-5 inline-flex items-center gap-2 rounded-lg bg-white/80 px-3 py-2 text-sm font-semibold text-emerald-800 shadow-sm">
          <BadgeCheck className="h-4 w-4" />
          School of Communication Technology
        </div>
        <h1 className="max-w-3xl text-4xl font-black leading-tight text-slate-950 sm:text-5xl lg:text-6xl">
          SCT E-Voting Portal
        </h1>
        <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-600">
          A secure digital election workspace for student registration, aspirant screening, transparent voting, real-time result analytics, and auditable SCT electoral administration.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link to="/login" className="btn-primary">
            Login <ArrowRight className="h-4 w-4" />
          </Link>
          <Link to="/register" className="btn-secondary">
            <UserPlus className="h-4 w-4" /> Register as Student
          </Link>
          <Link to="/register-aspirant" className="btn-secondary">
            <BookOpen className="h-4 w-4" /> Register as Aspirant
          </Link>
        </div>
      </div>
      <div className="relative">
        <div className="glass rounded-2xl p-5">
          <div className="rounded-xl bg-slate-950 p-5 text-white">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <p className="text-sm text-emerald-300">Election command center</p>
                <p className="text-2xl font-bold">SCT 2026</p>
              </div>
              <LockKeyhole className="h-8 w-8 text-emerald-300" />
            </div>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              {["Verified voters", "Aspirant screening", "One ballot per student", "PDF and CSV reports"].map((item) => (
                <div key={item} className="rounded-lg border border-white/10 bg-white/5 p-4">
                  <p className="text-sm font-semibold">{item}</p>
                  <div className="mt-3 h-2 rounded-full bg-white/10">
                    <div className="h-2 rounded-full bg-emerald-400" style={{ width: `${56 + item.length}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
);

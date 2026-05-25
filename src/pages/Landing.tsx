import { ArrowRight, BadgeCheck, BookOpen, CheckCircle2, ShieldCheck, UserPlus, Vote } from "lucide-react";
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
      <div className="hero-3d-stage" aria-label="SCT secure voting illustration">
        <div className="hero-3d-orbit">
          <div className="hero-3d-card hero-3d-card-left">
            <ShieldCheck className="h-5 w-5 text-emerald-300" />
            <span>Verified ID</span>
          </div>
          <div className="hero-3d-card hero-3d-card-right">
            <CheckCircle2 className="h-5 w-5 text-emerald-300" />
            <span>One vote</span>
          </div>
          <div className="hero-3d-ballot">
            <div className="hero-3d-ballot-top">
              <span>SCT 2026</span>
              <Vote className="h-5 w-5 text-emerald-300" />
            </div>
            <div className="hero-3d-slot" />
            <div className="hero-3d-paper">
              <span />
              <span />
              <span />
            </div>
          </div>
          <div className="hero-3d-base">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-emerald-300">Election command center</p>
              <p className="mt-1 text-2xl font-black text-white">Secure SCT Ballot</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {["Live results", "Audit logs", "Aspirants", "Reports"].map((item) => (
                <div key={item} className="rounded-lg border border-white/10 bg-white/5 p-3 text-sm font-semibold text-white">
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
);

import DatePicker from "react-datepicker";
import {
  BarChart3,
  Check,
  Download,
  FileText,
  ListChecks,
  Plus,
  Settings,
  ShieldCheck,
  Trash2,
  UserCheck,
  Users,
  X,
} from "lucide-react";
import type { ComponentType, ReactNode } from "react";
import { FormEvent, useMemo, useState } from "react";
import { Area, AreaChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { EmptyState, Field } from "../components/Layout";
import { useDb } from "../hooks/useDb";
import { mockDb } from "../services/mockDb";
import type { Candidate, DbState, Position, SessionUser } from "../types";
import { exportResultsCsv, exportResultsPdf } from "../utils/reports";
import { turnoutPercent, voteCountForCandidate } from "../utils/election";

const tabs = [
  ["analytics", "Analytics", BarChart3],
  ["pending", "Pending Users", UserCheck],
  ["aspirants", "Aspirants", ShieldCheck],
  ["candidates", "Candidates", Users],
  ["settings", "Settings", Settings],
  ["audit", "Audit Trail", ListChecks],
] as const;

type Tab = (typeof tabs)[number][0];
type DatePickerFieldProps = {
  className?: string;
  selected: Date;
  onChange: (date: Date | null) => void;
  showTimeSelect?: boolean;
  dateFormat?: string;
};

const colors = ["#047857", "#0e7490", "#d97706", "#7c3aed", "#be123c", "#475569"];
const DatePickerField = DatePicker as unknown as ComponentType<DatePickerFieldProps>;

export const AdminDashboard = ({ session }: { session: SessionUser }) => {
  const state = useDb();
  const [activeTab, setActiveTab] = useState<Tab>("analytics");
  const approvedStudents = state.users.filter((user) => user.role === "student" && user.status === "approved");
  const votedStudents = new Set(state.votes.map((vote) => vote.voterId)).size;

  const trend = useMemo(() => {
    const buckets = new Map<string, number>();
    state.votes.forEach((vote) => {
      const label = new Date(vote.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      buckets.set(label, (buckets.get(label) ?? 0) + 1);
    });
    return Array.from(buckets.entries()).map(([time, votes]) => ({ time, votes })).reverse();
  }, [state.votes]);

  const demographics = state.settings.departments.map((department) => ({
    name: department,
    value: approvedStudents.filter((student) => student.department === department).length,
  }));

  const renderActivePanel = () => {
    switch (activeTab) {
      case "analytics":
        return <AnalyticsPanel state={state} total={approvedStudents.length} voted={votedStudents} trend={trend} demographics={demographics} />;
      case "pending":
        return <PendingUsers state={state} session={session} />;
      case "aspirants":
        return <AspirantsPanel state={state} session={session} />;
      case "candidates":
        return <CandidatesPanel state={state} session={session} />;
      case "settings":
        return <SettingsPanel state={state} session={session} />;
      case "audit":
        return <AuditPanel state={state} />;
      default:
        return <EmptyState title="Unknown admin section" body="Choose a module from the admin navigation above." />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">Administrator workspace</p>
          <h1 className="mt-1 text-3xl font-black text-slate-950">SCT Election Control</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <button className="btn-secondary" onClick={() => exportResultsCsv(state)}>
            <Download className="h-4 w-4" /> CSV
          </button>
          <button className="btn-primary" onClick={() => exportResultsPdf(state)}>
            <FileText className="h-4 w-4" /> PDF Report
          </button>
        </div>
      </div>
      <div className="glass overflow-x-auto rounded-2xl p-2">
        <div className="flex min-w-max gap-1">
          {tabs.map(([id, label, Icon]) => (
            <button
              key={id}
              className={`inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition ${
                activeTab === id ? "bg-slate-950 text-white" : "text-slate-600 hover:bg-white"
              }`}
              onClick={() => setActiveTab(id)}
            >
              <Icon className="h-4 w-4" /> {label}
            </button>
          ))}
        </div>
      </div>
      <section className="min-h-80">{renderActivePanel()}</section>
    </div>
  );
};

const AnalyticsPanel = ({
  state,
  total,
  voted,
  trend,
  demographics,
}: {
  state: DbState;
  total: number;
  voted: number;
  trend: Array<{ time: string; votes: number }>;
  demographics: Array<{ name: string; value: number }>;
}) => (
  <div className="space-y-6">
    <div className="grid gap-4 md:grid-cols-3">
      {[
        ["Total Registered", total, "Approved student voters"],
        ["Votes Cast", voted, "Unique students who submitted"],
        ["Turnout", `${turnoutPercent(state)}%`, "Based on approved voters"],
      ].map(([label, value, hint]) => (
        <div key={label} className="glass rounded-2xl p-5">
          <p className="text-sm font-semibold text-slate-500">{label}</p>
          <p className="mt-3 text-3xl font-black text-slate-950">{value}</p>
          <p className="mt-1 text-sm text-slate-500">{hint}</p>
        </div>
      ))}
    </div>
    <div className="grid gap-6 lg:grid-cols-[1.35fr_0.65fr]">
      <div className="glass rounded-2xl p-5">
        <h2 className="text-lg font-bold text-slate-950">Vote trends</h2>
        <div className="mt-4 h-72">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trend}>
              <defs>
                <linearGradient id="voteGradient" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="5%" stopColor="#047857" stopOpacity={0.45} />
                  <stop offset="95%" stopColor="#047857" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#dbe3ea" />
              <XAxis dataKey="time" tick={{ fontSize: 12 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
              <Tooltip />
              <Area type="monotone" dataKey="votes" stroke="#047857" fill="url(#voteGradient)" strokeWidth={3} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="glass rounded-2xl p-5">
        <h2 className="text-lg font-bold text-slate-950">Voters by department</h2>
        <div className="mt-4 h-72">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={demographics} dataKey="value" nameKey="name" outerRadius={95} label>
                {demographics.map((entry, index) => (
                  <Cell key={entry.name} fill={colors[index % colors.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  </div>
);

const PendingUsers = ({ state, session }: { state: DbState; session: SessionUser }) => {
  const pending = state.users.filter((user) => user.role === "student" && user.status === "pending");
  if (!pending.length) {
    return (
      <PanelCard title="Pending user approvals" subtitle="Student registration requests appear here after they submit the registration form.">
        <EmptyState title="No pending users" body="New student registrations will appear here for review." />
      </PanelCard>
    );
  }
  return (
    <PanelCard title="Pending user approvals" subtitle={`${pending.length} student registration${pending.length === 1 ? "" : "s"} waiting for review.`}>
      <div className="grid gap-4 md:grid-cols-2">
        {pending.map((user) => (
          <div key={user.id} className="rounded-2xl border border-slate-200 bg-white/80 p-5 shadow-sm">
            <div className="flex gap-4">
              <img src={user.idCardImage || "https://placehold.co/180x120/e2e8f0/334155?text=ID+Card"} alt={`${user.fullName} ID card`} className="h-28 w-36 rounded-lg object-cover" />
              <div className="min-w-0">
                <p className="font-bold text-slate-950">{user.fullName}</p>
                <p className="text-sm text-slate-500">{user.matricNumber}</p>
                <p className="text-sm text-slate-500">{user.department}</p>
              </div>
            </div>
            <div className="mt-5 flex gap-2">
              <button className="btn-primary flex-1" onClick={() => mockDb.updateUserStatus(user.id, "approved", session)}>
                <Check className="h-4 w-4" /> Approve
              </button>
              <button className="btn-danger flex-1" onClick={() => mockDb.updateUserStatus(user.id, "rejected", session)}>
                <X className="h-4 w-4" /> Reject
              </button>
            </div>
          </div>
        ))}
      </div>
    </PanelCard>
  );
};

const AspirantsPanel = ({ state, session }: { state: DbState; session: SessionUser }) => {
  if (!state.aspirants.length) {
    return (
      <PanelCard title="Aspirants management" subtitle="Review aspirant applications and verify payment before promotion.">
        <EmptyState title="No aspirant applications" body="Aspirant registrations and payment statuses will be shown here." />
      </PanelCard>
    );
  }
  return (
    <PanelCard title="Aspirants management" subtitle="Verify payment status and promote qualified aspirants to active candidates.">
    <div className="overflow-x-auto">
      <table className="w-full min-w-[1100px] text-left text-sm">
        <thead className="text-xs uppercase text-slate-500">
          <tr>
            <th className="p-3">Aspirant</th>
            <th className="p-3">Position</th>
            <th className="p-3">GPA</th>
            <th className="p-3">Documents</th>
            <th className="p-3">Payment</th>
            <th className="p-3">Status</th>
            <th className="p-3">Actions</th>
          </tr>
        </thead>
        <tbody>
          {state.aspirants.map((aspirant) => (
            <tr key={aspirant.id} className="border-t border-slate-100">
              <td className="p-3">
                <div className="flex items-center gap-3">
                  <img src={aspirant.passportImage || "https://placehold.co/64x64/e2e8f0/334155?text=Photo"} alt="" className="h-12 w-12 rounded-lg object-cover" />
                  <div>
                    <p className="font-semibold text-slate-900">{aspirant.fullName}</p>
                    <p className="text-xs text-slate-500">{aspirant.department}</p>
                  </div>
                </div>
              </td>
              <td className="p-3">{state.positions.find((position) => position.id === aspirant.positionId)?.title}</td>
              <td className="p-3 font-semibold text-slate-900">{Number.isFinite(aspirant.gpa) ? aspirant.gpa.toFixed(2) : "Not set"}</td>
              <td className="p-3">
                <div className="flex flex-wrap gap-2">
                  <DocumentLink href={aspirant.resultFile} label="Result" />
                  <DocumentLink href={aspirant.idCardImage} label="ID Card" />
                </div>
              </td>
              <td className="p-3">
                <select className="input" value={aspirant.paymentStatus} onChange={(event) => mockDb.updateAspirant(aspirant.id, { paymentStatus: event.target.value as typeof aspirant.paymentStatus }, session)}>
                  <option value="pending">Pending</option>
                  <option value="verified">Verified</option>
                  <option value="rejected">Rejected</option>
                </select>
              </td>
              <td className="p-3 capitalize">{aspirant.status}</td>
              <td className="p-3">
                <button className="btn-primary" disabled={aspirant.paymentStatus !== "verified" || aspirant.status === "approved"} onClick={() => mockDb.promoteAspirant(aspirant.id, session)}>
                  Promote
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
    </PanelCard>
  );
};

const CandidatesPanel = ({ state, session }: { state: DbState; session: SessionUser }) => {
  const blankCandidate: Candidate = { id: "", fullName: "", department: state.settings.departments[0] ?? "", positionId: state.positions[0]?.id ?? "", manifesto: "", isActive: true, createdAt: "" };
  const blankPosition: Position = { id: "", title: "", formPrice: 0, eligibleLevels: ["200", "300", "400"], maxSelections: 1, isActive: true };
  const [candidate, setCandidate] = useState<Candidate>(blankCandidate);
  const [position, setPosition] = useState<Position>(blankPosition);
  const [departments, setDepartments] = useState(state.settings.departments.join(", "));
  const [levels, setLevels] = useState((state.settings.levels?.length ? state.settings.levels : ["100", "200", "300", "400", "500"]).join(", "));

  const saveCandidate = (event: FormEvent) => {
    event.preventDefault();
    mockDb.saveCandidate(candidate, session);
    setCandidate(blankCandidate);
  };

  const savePosition = (event: FormEvent) => {
    event.preventDefault();
    mockDb.savePosition(position, session);
    setPosition(blankPosition);
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
      <div className="space-y-6">
        <form className="glass rounded-2xl p-5" onSubmit={saveCandidate}>
          <h2 className="text-lg font-bold">Candidate</h2>
          <div className="mt-4 grid gap-3">
            <Field label="Full name"><input className="input" value={candidate.fullName} onChange={(event) => setCandidate({ ...candidate, fullName: event.target.value })} required /></Field>
            <Field label="Department"><select className="input" value={candidate.department} onChange={(event) => setCandidate({ ...candidate, department: event.target.value })}>{state.settings.departments.map((department) => <option key={department}>{department}</option>)}</select></Field>
            <Field label="Position"><select className="input" value={candidate.positionId} onChange={(event) => setCandidate({ ...candidate, positionId: event.target.value })}>{state.positions.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}</select></Field>
            <Field label="Manifesto"><textarea className="input min-h-24" value={candidate.manifesto} onChange={(event) => setCandidate({ ...candidate, manifesto: event.target.value })} required /></Field>
            <button className="btn-primary" type="submit"><Plus className="h-4 w-4" /> Save candidate</button>
          </div>
        </form>
        <form className="glass rounded-2xl p-5" onSubmit={savePosition}>
          <h2 className="text-lg font-bold">Position</h2>
          <div className="mt-4 grid gap-3">
            <Field label="Title"><input className="input" value={position.title} onChange={(event) => setPosition({ ...position, title: event.target.value })} required /></Field>
            <Field label="Form price"><input className="input" type="number" value={position.formPrice} onChange={(event) => setPosition({ ...position, formPrice: Number(event.target.value) })} required /></Field>
            <Field label="Eligible levels"><input className="input" value={position.eligibleLevels.join(", ")} onChange={(event) => setPosition({ ...position, eligibleLevels: event.target.value.split(",").map((item) => item.trim()).filter(Boolean) })} /></Field>
            <button className="btn-primary" type="submit"><Plus className="h-4 w-4" /> Save position</button>
          </div>
        </form>
      </div>
      <div className="space-y-6">
        <div className="glass rounded-2xl p-5">
          <h2 className="text-lg font-bold">Registration options</h2>
          <Field label="Departments" hint="Separate departments with commas.">
            <textarea className="input min-h-20" value={departments} onChange={(event) => setDepartments(event.target.value)} />
          </Field>
          <div className="mt-4">
            <Field label="Levels" hint="Separate levels with commas. These appear on student and aspirant registration pages.">
              <input className="input" value={levels} onChange={(event) => setLevels(event.target.value)} placeholder="100, 200, 300, 400, 500" />
            </Field>
          </div>
          <button
            className="btn-secondary mt-3"
            onClick={() =>
              mockDb.updateSettings(
                {
                  ...state.settings,
                  departments: departments.split(",").map((item) => item.trim()).filter(Boolean),
                  levels: levels.split(",").map((item) => item.trim()).filter(Boolean),
                },
                session,
              )
            }
          >
            Update registration options
          </button>
        </div>
        <div className="glass overflow-x-auto rounded-2xl p-4">
          <h2 className="px-2 pb-3 text-lg font-bold">Official candidates</h2>
          <table className="w-full min-w-[640px] text-sm">
            <tbody>
              {state.candidates.map((item) => (
                <tr key={item.id} className="border-t border-slate-100">
                  <td className="p-3 font-semibold">{item.fullName}</td>
                  <td className="p-3">{state.positions.find((pos) => pos.id === item.positionId)?.title}</td>
                  <td className="p-3">{voteCountForCandidate(state, item.id)} votes</td>
                  <td className="p-3 text-right">
                    <button className="btn-secondary mr-2 px-3" onClick={() => setCandidate(item)}>Edit</button>
                    <button className="btn-danger px-3" onClick={() => mockDb.deleteCandidate(item.id, session)}><Trash2 className="h-4 w-4" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const SettingsPanel = ({ state, session }: { state: DbState; session: SessionUser }) => {
  const [portalEnabled, setPortalEnabled] = useState(state.settings.portalEnabled);
  const [startAt, setStartAt] = useState(new Date(state.settings.startAt));
  const [endAt, setEndAt] = useState(new Date(state.settings.endAt));
  return (
    <div className="glass max-w-3xl rounded-2xl p-6">
      <h2 className="text-xl font-bold text-slate-950">Election settings</h2>
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <Field label="Start date and time">
          <DatePickerField className="input" selected={startAt} onChange={(date: Date | null) => date instanceof Date && setStartAt(date)} showTimeSelect dateFormat="PPpp" />
        </Field>
        <Field label="End date and time">
          <DatePickerField className="input" selected={endAt} onChange={(date: Date | null) => date instanceof Date && setEndAt(date)} showTimeSelect dateFormat="PPpp" />
        </Field>
      </div>
      <label className="mt-5 flex items-center justify-between rounded-xl border border-slate-200 bg-white/70 p-4">
        <span>
          <span className="block font-semibold text-slate-900">Voting portal</span>
          <span className="text-sm text-slate-500">Master enable or disable toggle.</span>
        </span>
        <input className="h-6 w-6 accent-emerald-700" type="checkbox" checked={portalEnabled} onChange={(event) => setPortalEnabled(event.target.checked)} />
      </label>
      <button className="btn-primary mt-5" onClick={() => mockDb.updateSettings({ ...state.settings, portalEnabled, startAt: startAt.toISOString(), endAt: endAt.toISOString() }, session)}>
        Save settings
      </button>
    </div>
  );
};

const AuditPanel = ({ state }: { state: DbState }) => {
  return (
    <PanelCard title="Audit trail" subtitle="Read-only record of admin and voting actions.">
    <div className="overflow-x-auto">
      <table className="w-full min-w-[720px] text-left text-sm">
        <thead className="text-xs uppercase text-slate-500">
          <tr><th className="p-3">Time</th><th className="p-3">Actor</th><th className="p-3">Action</th><th className="p-3">Entity</th></tr>
        </thead>
        <tbody>
          {state.auditLogs.map((log) => (
            <tr key={log.id} className="border-t border-slate-100">
              <td className="p-3">{new Date(log.createdAt).toLocaleString()}</td>
              <td className="p-3 font-semibold">{log.actorName}</td>
              <td className="p-3">{log.action}</td>
              <td className="p-3 capitalize">{log.entityType}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
    </PanelCard>
  );
};

const PanelCard = ({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) => (
  <div className="glass rounded-2xl p-5">
    <div className="mb-5">
      <h2 className="text-xl font-bold text-slate-950">{title}</h2>
      <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
    </div>
    {children}
  </div>
);

const DocumentLink = ({ href, label }: { href?: string; label: string }) => {
  if (!href) return <span className="rounded-lg bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-500">{label}: Missing</span>;

  return (
    <a className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-emerald-500 hover:text-emerald-700" href={href} target="_blank" rel="noreferrer">
      View {label}
    </a>
  );
};

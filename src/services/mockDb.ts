import type {
  Aspirant,
  AuditLog,
  Candidate,
  DbState,
  ElectionSettings,
  Position,
  SessionUser,
  User,
  Vote,
} from "../types";
import { cloudState } from "./cloudState";

const DB_KEY = "sct-evoting-db-v1";
const SESSION_KEY = "sct-evoting-session-v1";

type Listener = (state: DbState) => void;
const listeners = new Set<Listener>();

const now = () => new Date().toISOString();
const uid = (prefix: string) => `${prefix}_${crypto.randomUUID()}`;

const hashPassword = (password: string) => {
  const normalized = password.trim();
  let hash = 0;
  for (let index = 0; index < normalized.length; index += 1) {
    hash = (hash << 5) - hash + normalized.charCodeAt(index);
    hash |= 0;
  }
  return `mock_${Math.abs(hash).toString(36)}`;
};

const defaultPositions: Position[] = [
  { id: "pos_president", title: "SUG President", formPrice: 15000, eligibleLevels: ["200", "300", "400"], maxSelections: 1, isActive: true },
  { id: "pos_vp", title: "Vice President", formPrice: 12000, eligibleLevels: ["200", "300", "400"], maxSelections: 1, isActive: true },
  { id: "pos_secretary", title: "General Secretary", formPrice: 10000, eligibleLevels: ["200", "300", "400"], maxSelections: 1, isActive: true },
  { id: "pos_treasurer", title: "Treasurer", formPrice: 9000, eligibleLevels: ["200", "300", "400"], maxSelections: 1, isActive: true },
];

const defaultDepartments = ["Computer Science", "Mass Communication", "Library & Information Science", "Office Technology", "Statistics"];
const defaultLevels = ["100", "200", "300", "400", "500"];

const defaultSettings: ElectionSettings = {
  portalEnabled: true,
  startAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
  endAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  departments: defaultDepartments,
  levels: defaultLevels,
  updatedAt: now(),
};

const seedState = (): DbState => {
 const admin: User = {
  id: "admin_sct",
  role: "admin",
  fullName: "AbdulWasiu",
  department: "SCT",
  passwordHash: hashPassword("Wase14053@."),
  status: "approved",
  hasVoted: false,
  createdAt: now(),
};

  const students: User[] = [
    ["Ada Chukwu", "SCT/CS/21/001", "Computer Science", "300", "approved", true],
    ["Tomi Adewale", "SCT/MC/21/042", "Mass Communication", "300", "approved", true],
    ["Nora Effiong", "SCT/LIS/22/019", "Library & Information Science", "200", "pending", false],
    ["Kelvin Okoye", "SCT/OTM/20/087", "Office Technology", "400", "approved", false],
  ].map(([fullName, matricNumber, department, level, status, hasVoted]) => ({
    id: uid("usr"),
    role: "student",
    fullName: String(fullName),
    matricNumber: String(matricNumber),
    department: String(department),
    level: String(level),
    passwordHash: hashPassword("password"),
    status: status as User["status"],
    hasVoted: Boolean(hasVoted),
    idCardImage: "",
    createdAt: now(),
  }));

  const candidates: Candidate[] = [
    ["Ifeanyi Nwosu", "Computer Science", "300", "pos_president", "A transparent SCT union with digital-first services."],
    ["Mariam Bello", "Mass Communication", "300", "pos_president", "A student voice that is visible, accountable, and active."],
    ["Seyi Cole", "Office Technology", "400", "pos_vp", "Better welfare, faster communication, stronger representation."],
    ["Bisi Hart", "Library & Information Science", "300", "pos_secretary", "Clear records, open minutes, and efficient student support."],
  ].map(([fullName, department, level, positionId, manifesto]) => ({
    id: uid("cand"),
    fullName: String(fullName),
    department: String(department),
    level: String(level),
    positionId: String(positionId),
    manifesto: String(manifesto),
    isActive: true,
    createdAt: now(),
  }));

  const votes: Vote[] = [
    { id: uid("vote"), voterId: students[0].id, positionId: "pos_president", candidateId: candidates[0].id, department: students[0].department, createdAt: new Date(Date.now() - 50 * 60 * 1000).toISOString() },
    { id: uid("vote"), voterId: students[0].id, positionId: "pos_vp", candidateId: candidates[2].id, department: students[0].department, createdAt: new Date(Date.now() - 45 * 60 * 1000).toISOString() },
    { id: uid("vote"), voterId: students[1].id, positionId: "pos_president", candidateId: candidates[1].id, department: students[1].department, createdAt: new Date(Date.now() - 35 * 60 * 1000).toISOString() },
  ];

  return {
    users: [admin, ...students],
    aspirants: [],
    candidates,
    positions: defaultPositions,
    votes,
    auditLogs: [
      { id: uid("log"), actorId: admin.id, actorName: admin.fullName, action: "Initialized SCT E-Voting portal", entityType: "settings", createdAt: now() },
    ],
    settings: defaultSettings,
  };
};

const read = (): DbState => {
  const raw = localStorage.getItem(DB_KEY);
  if (!raw) {
    const seeded = seedState();
    localStorage.setItem(DB_KEY, JSON.stringify(seeded));
    return seeded;
  }
  const parsed = JSON.parse(raw) as DbState;
  const normalized: DbState = {
    ...parsed,
    settings: {
      ...defaultSettings,
      ...parsed.settings,
      departments: parsed.settings?.departments?.length ? parsed.settings.departments : defaultDepartments,
      levels: parsed.settings?.levels?.length ? parsed.settings.levels : defaultLevels,
    },
  };
  if (!parsed.settings?.levels?.length) localStorage.setItem(DB_KEY, JSON.stringify(normalized));
  return normalized;
};

const write = (state: DbState) => {
  localStorage.setItem(DB_KEY, JSON.stringify(state));
  listeners.forEach((listener) => listener(state));
  void cloudState.save(state);
};

const mutate = (recipe: (state: DbState) => DbState) => {
  const next = recipe(read());
  write(next);
  return next;
};

const log = (state: DbState, actor: SessionUser | null, action: string, entityType: AuditLog["entityType"], entityId?: string) => ({
  ...state,
  auditLogs: [
    {
      id: uid("log"),
      actorId: actor?.id ?? "system",
      actorName: actor?.fullName ?? "System",
      action,
      entityType,
      entityId,
      createdAt: now(),
    },
    ...state.auditLogs,
  ],
});

export const mockDb = {
  hashPassword,
  getState: read,
  subscribe(listener: Listener) {
    listeners.add(listener);
    listener(read());
    void cloudState.load().then((cloud) => {
      if (!cloud) return;
      localStorage.setItem(DB_KEY, JSON.stringify(cloud));
      listeners.forEach((current) => current(cloud));
    });
    const unsubscribeCloud = cloudState.subscribe((cloud) => {
      localStorage.setItem(DB_KEY, JSON.stringify(cloud));
      listeners.forEach((current) => current(cloud));
    });
    return () => {
      listeners.delete(listener);
      unsubscribeCloud();
    };
  },
  getSession(): SessionUser | null {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as SessionUser) : null;
  },
  setSession(user: SessionUser | null) {
    if (!user) {
      localStorage.removeItem(SESSION_KEY);
      return;
    }
    localStorage.setItem(SESSION_KEY, JSON.stringify(user));
  },
  login(identifier: string, password: string) {
    const state = read();
    const passwordHash = hashPassword(password);
    const normalizedIdentifier = identifier.trim().toLowerCase();
    const user = state.users.find((item) => {
      const identifiers =
        item.role === "admin"
          ? [item.fullName, item.matricNumber, item.id, "admin"]
          : [item.matricNumber];
      return identifiers.some((value) => value?.toLowerCase() === normalizedIdentifier) && item.passwordHash === passwordHash;
    });
    if (!user) return { ok: false, message: "Invalid login credentials." };
    if (user.status !== "approved") return { ok: false, message: "Your registration is still awaiting approval." };
    const session: SessionUser = { id: user.id, role: user.role, fullName: user.fullName, department: user.department };
    mockDb.setSession(session);
    mutate((current) => log(current, session, `Logged in as ${user.role}`, "auth", user.id));
    return { ok: true, user: session };
  },
  registerStudent(input: Omit<User, "id" | "role" | "passwordHash" | "status" | "hasVoted" | "createdAt"> & { password: string }) {
    return mutate((state) => {
      if (state.users.some((user) => user.matricNumber?.toLowerCase() === input.matricNumber?.toLowerCase())) {
        throw new Error("A student with this matric number already exists.");
      }
      const user: User = {
        id: uid("usr"),
        role: "student",
        fullName: input.fullName,
        matricNumber: input.matricNumber,
        department: input.department,
        level: input.level,
        passwordHash: hashPassword(input.password),
        status: "pending",
        idCardImage: input.idCardImage,
        hasVoted: false,
        createdAt: now(),
      };
      return log({ ...state, users: [user, ...state.users] }, null, `Student registration submitted for ${user.fullName}`, "user", user.id);
    });
  },
  registerAspirant(input: Omit<Aspirant, "id" | "passwordHash" | "paymentStatus" | "status" | "createdAt"> & { password: string }) {
    return mutate((state) => {
      const aspirant: Aspirant = {
        id: uid("asp"),
        fullName: input.fullName,
        matricNumber: input.matricNumber,
        department: input.department,
        level: input.level,
        passwordHash: hashPassword(input.password),
        positionId: input.positionId,
        gpa: input.gpa,
        manifesto: input.manifesto,
        passportImage: input.passportImage,
        resultFile: input.resultFile,
        idCardImage: input.idCardImage,
        paymentStatus: "pending",
        status: "pending",
        createdAt: now(),
      };
      return log({ ...state, aspirants: [aspirant, ...state.aspirants] }, null, `Aspirant application submitted for ${aspirant.fullName}`, "aspirant", aspirant.id);
    });
  },
  updateUserStatus(userId: string, status: User["status"], actor: SessionUser | null) {
    return mutate((state) => {
      const user = state.users.find((item) => item.id === userId);
      const next = { ...state, users: state.users.map((item) => (item.id === userId ? { ...item, status } : item)) };
      return log(next, actor, `${status === "approved" ? "Approved" : "Rejected"} user ${user?.fullName ?? userId}`, "user", userId);
    });
  },
  updateAspirant(aspirantId: string, patch: Partial<Aspirant>, actor: SessionUser | null) {
    return mutate((state) => {
      const aspirant = state.aspirants.find((item) => item.id === aspirantId);
      const next = { ...state, aspirants: state.aspirants.map((item) => (item.id === aspirantId ? { ...item, ...patch } : item)) };
      return log(next, actor, `Updated aspirant ${aspirant?.fullName ?? aspirantId}`, "aspirant", aspirantId);
    });
  },
  promoteAspirant(aspirantId: string, actor: SessionUser | null) {
    return mutate((state) => {
      const aspirant = state.aspirants.find((item) => item.id === aspirantId);
      if (!aspirant) return state;
      const candidate: Candidate = {
        id: uid("cand"),
        aspirantId: aspirant.id,
        fullName: aspirant.fullName,
        matricNumber: aspirant.matricNumber,
        department: aspirant.department,
        level: aspirant.level,
        positionId: aspirant.positionId,
        manifesto: aspirant.manifesto,
        photo: aspirant.passportImage,
        isActive: true,
        createdAt: now(),
      };
      const next = {
        ...state,
        candidates: [candidate, ...state.candidates],
        aspirants: state.aspirants.map((item) => (item.id === aspirantId ? { ...item, status: "approved" as const, paymentStatus: "verified" as const } : item)),
      };
      return log(next, actor, `Promoted ${aspirant.fullName} to candidate`, "candidate", candidate.id);
    });
  },
  saveCandidate(candidate: Candidate, actor: SessionUser | null) {
    return mutate((state) => {
      const exists = state.candidates.some((item) => item.id === candidate.id);
      const candidates = exists
        ? state.candidates.map((item) => (item.id === candidate.id ? candidate : item))
        : [{ ...candidate, id: uid("cand"), createdAt: now() }, ...state.candidates];
      return log({ ...state, candidates }, actor, `${exists ? "Updated" : "Added"} candidate ${candidate.fullName}`, "candidate", candidate.id);
    });
  },
  deleteCandidate(candidateId: string, actor: SessionUser | null) {
    return mutate((state) => log({ ...state, candidates: state.candidates.filter((item) => item.id !== candidateId) }, actor, "Deleted candidate", "candidate", candidateId));
  },
  savePosition(position: Position, actor: SessionUser | null) {
    return mutate((state) => {
      const exists = state.positions.some((item) => item.id === position.id);
      const positions = exists ? state.positions.map((item) => (item.id === position.id ? position : item)) : [{ ...position, id: uid("pos") }, ...state.positions];
      return log({ ...state, positions }, actor, `${exists ? "Updated" : "Added"} position ${position.title}`, "position", position.id);
    });
  },
  updateSettings(settings: ElectionSettings, actor: SessionUser | null) {
    return mutate((state) => log({ ...state, settings: { ...settings, updatedAt: now() } }, actor, "Changed election settings", "settings"));
  },
  castVotes(voter: SessionUser, selections: Record<string, string>) {
    return mutate((state) => {
      const user = state.users.find((item) => item.id === voter.id);
      if (!user || user.hasVoted) throw new Error("This account has already submitted a ballot.");
      const ballots: Vote[] = Object.entries(selections).map(([positionId, candidateId]) => ({
        id: uid("vote"),
        voterId: voter.id,
        positionId,
        candidateId,
        department: voter.department,
        createdAt: now(),
      }));
      const next = {
        ...state,
        votes: [...ballots, ...state.votes],
        users: state.users.map((item) => (item.id === voter.id ? { ...item, hasVoted: true } : item)),
      };
      return log(next, voter, `Ballot submitted by ${voter.fullName}`, "vote", voter.id);
    });
  },
  resetDemoData() {
    const seeded = seedState();
    write(seeded);
    localStorage.removeItem(SESSION_KEY);
  },
};

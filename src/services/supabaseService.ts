import { isSupabaseConfigured, supabase } from "./supabaseClient";
import type {
  ApprovalStatus,
  AuditLog,
  Candidate,
  DbState,
  ElectionSettings,
  Position,
  PaymentStatus,
  Role,
  SessionUser,
  User,
  Aspirant,
  Vote,
} from "../types";

type DbUserRow = { id: string; role: string; full_name: string; department: string };
type DbAspirantRow = {
  id: string;
  full_name: string;
  matric_number: string;
  department: string;
  level: string;
  position_id: string;
  manifesto: string;
  passport_image?: string | null;
  result_file?: string | null;
  id_card_image?: string | null;
  payment_receipt?: string | null;
  payment_status: PaymentStatus;
  status: ApprovalStatus;
  has_voted: boolean;
};

const defaultSettings: ElectionSettings = {
  portalEnabled: false,
  startAt: new Date().toISOString(),
  endAt: new Date().toISOString(),
  departments: [],
  levels: [],
  paymentBankName: "",
  paymentAccountName: "",
  paymentAccountNumber: "",
  updatedAt: new Date().toISOString(),
};

const normalizeError = (error: unknown) => {
  if (!error || typeof error !== "object") return "A Supabase error occurred.";
  if ("message" in error && typeof error.message === "string") return error.message;
  return "A Supabase error occurred.";
};

const ensureSupabase = () => {
  if (!supabase) {
    throw new Error("Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.");
  }
};

const toSessionUser = (item: { id: string; role: string; full_name: string; department: string }): SessionUser => ({
  id: item.id,
  role: item.role as Role,
  fullName: item.full_name,
  department: item.department,
});

const logAction = async (
  actor: SessionUser | null,
  action: string,
  entityType: AuditLog["entityType"],
  entityId?: string,
) => {
  ensureSupabase();
  const { error } = await supabase.from("audit_logs").insert({
    actor_id: actor?.id ?? "system",
    actor_name: actor?.fullName ?? "System",
    action,
    entity_type: entityType,
    entity_id: entityId ?? null,
  });
  return error ? normalizeError(error) : null;
};

export const fetchProfile = async (authUserId: string): Promise<{ data: SessionUser | null; error: string | null }> => {
  if (authUserId === LOCAL_ADMIN_SESSION.id) {
    return { data: LOCAL_ADMIN_SESSION, error: null };
  }

  ensureSupabase();

  const { data: userData, error: userError } = await supabase
    .from("users")
    .select("id,role,full_name,department")
    .eq("id", authUserId)
    .maybeSingle();

  const user = userData as DbUserRow | null;
  if (userError) return { data: null, error: normalizeError(userError) };
  if (user) return { data: toSessionUser(user), error: null };

  const { data: aspirantData, error: aspirantError } = await supabase
    .from("aspirants")
    .select("id,full_name,department")
    .eq("id", authUserId)
    .maybeSingle();
  const aspirant = aspirantData as DbAspirantRow | null;

  if (aspirantError) return { data: null, error: normalizeError(aspirantError) };
  if (!aspirant) return { data: null, error: "No matching profile found for this account." };

  return { data: { id: aspirant.id, role: "aspirant", fullName: aspirant.full_name, department: aspirant.department }, error: null };
};

const deriveAuthEmail = (identifier: string) => `${normalizeMatric(identifier).replace(/\s+/g, "")}@sct-voting.local`;
const normalizeAuthIdentifier = (identifier: string) => identifier.trim().toLowerCase();

const LOCAL_ADMIN_SESSION_KEY = "sct-voting-local-admin-session";
const LOCAL_ADMIN_IDENTIFIER = "admin";
const LOCAL_ADMIN_PASSWORD = "Admin123!";
const LOCAL_ADMIN_SESSION: SessionUser = {
  id: "local-admin",
  role: "admin",
  fullName: "Administrator",
  department: "Administration",
};

export const getLocalAdminSession = (): SessionUser | null => {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(LOCAL_ADMIN_SESSION_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as SessionUser;
  } catch {
    return null;
  }
};

const saveLocalAdminSession = (session: SessionUser) => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(LOCAL_ADMIN_SESSION_KEY, JSON.stringify(session));
};

const clearLocalAdminSession = () => {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(LOCAL_ADMIN_SESSION_KEY);
};

const buildAuthEmailCandidates = (identifier: string) => {
  const normalized = normalizeAuthIdentifier(identifier);
  if (normalized.includes("@")) {
    return [normalized];
  }
  return [deriveAuthEmail(normalized), normalized];
};

const LOCAL_ADMIN_SIGNIN_EVENT = "sct-voting-local-admin-signin";
const LOCAL_ADMIN_SIGNOUT_EVENT = "sct-voting-local-admin-signout";

export const signIn = async (identifier: string, password: string): Promise<{ data: SessionUser | null; error: string | null }> => {
  if (normalizeAuthIdentifier(identifier) === LOCAL_ADMIN_IDENTIFIER && password === LOCAL_ADMIN_PASSWORD) {
    saveLocalAdminSession(LOCAL_ADMIN_SESSION);
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event(LOCAL_ADMIN_SIGNIN_EVENT));
    }
    return { data: LOCAL_ADMIN_SESSION, error: null };
  }

  ensureSupabase();
  const candidateEmails = buildAuthEmailCandidates(identifier);
  let lastError: unknown = null;

  for (const email of candidateEmails) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      lastError = error;
      continue;
    }
    if (!data.session) {
      lastError = "Unable to sign in.";
      continue;
    }
    return fetchProfile(data.session.user.id);
  }

  return { data: null, error: normalizeError(lastError) };
};

export const signOut = async (): Promise<string | null> => {
  clearLocalAdminSession();
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(LOCAL_ADMIN_SIGNOUT_EVENT));
  }
  if (!isSupabaseConfigured || !supabase) return null;
  const { error } = await supabase.auth.signOut();
  return error ? normalizeError(error) : null;
};

const normalizeMatric = (matricNumber: string) => matricNumber.trim().toLowerCase();

const ensureUniqueMatric = async (matricNumber: string) => {
  ensureSupabase();
  const normalized = normalizeMatric(matricNumber);
  const [users, aspirants, candidates] = await Promise.all([
    supabase.from("users").select("id").ilike("matric_number", normalized).limit(1),
    supabase.from("aspirants").select("id").ilike("matric_number", normalized).limit(1),
    supabase.from("candidates").select("id").ilike("matric_number", normalized).limit(1),
  ]);

  if (users.error || aspirants.error || candidates.error) {
    throw new Error(normalizeError(users.error ?? aspirants.error ?? candidates.error));
  }

  if ((users.data?.length ?? 0) || (aspirants.data?.length ?? 0) || (candidates.data?.length ?? 0)) {
    return false;
  }
  return true;
};

export const registerStudent = async (input: {
  password: string;
  fullName: string;
  matricNumber: string;
  department: string;
  level: string;
  idCardImage: string;
}): Promise<{ error: string | null }> => {
  ensureSupabase();
  if (!(await ensureUniqueMatric(input.matricNumber))) {
    return { error: "A user with this matric number already exists." };
  }

  const authEmail = deriveAuthEmail(input.matricNumber);
  const signUp = await supabase.auth.signUp({ email: authEmail, password: input.password });
  if (signUp.error || !signUp.data.user) {
    return { error: normalizeError(signUp.error ?? "Unable to register student.") };
  }

  const { error } = await supabase.from("users").insert({
    id: signUp.data.user.id,
    role: "student",
    full_name: input.fullName,
    matric_number: input.matricNumber,
    department: input.department,
    level: input.level,
    password_hash: "supabase-auth",
    status: "pending",
    id_card_image: input.idCardImage,
    has_voted: false,
  });

  return { error: error ? normalizeError(error) : null };
};

export const registerAspirant = async (input: {
  password: string;
  fullName: string;
  matricNumber: string;
  department: string;
  level: string;
  positionId: string;
  gpa: number;
  manifesto: string;
  passportImage: string;
  resultFile: string;
  idCardImage: string;
}): Promise<{ error: string | null }> => {
  ensureSupabase();
  if (!(await ensureUniqueMatric(input.matricNumber))) {
    return { error: "A user with this matric number already exists." };
  }

  const authEmail = deriveAuthEmail(input.matricNumber);
  const signUp = await supabase.auth.signUp({ email: authEmail, password: input.password });
  if (signUp.error || !signUp.data.user) {
    return { error: normalizeError(signUp.error ?? "Unable to register aspirant.") };
  }

  const { error } = await supabase.from("aspirants").insert({
    id: signUp.data.user.id,
    full_name: input.fullName,
    matric_number: input.matricNumber,
    department: input.department,
    level: input.level,
    password_hash: "supabase-auth",
    position_id: input.positionId,
    gpa: input.gpa,
    manifesto: input.manifesto,
    passport_image: input.passportImage,
    result_file: input.resultFile,
    id_card_image: input.idCardImage,
    payment_receipt: null,
    payment_submitted_at: null,
    payment_status: "pending",
    status: "pending",
    has_voted: false,
  });

  return { error: error ? normalizeError(error) : null };
};

export const fetchElectionSettings = async (): Promise<{ data: ElectionSettings; error: string | null }> => {
  ensureSupabase();
  const { data, error } = await supabase.from("election_settings").select("*").maybeSingle();
  const settings = data as ElectionSettings | null;
  if (error) return { data: defaultSettings, error: normalizeError(error) };
  return { data: settings ?? defaultSettings, error: null };
};

export const fetchPositions = async (): Promise<{ data: Position[]; error: string | null }> => {
  ensureSupabase();
  const { data, error } = await supabase.from("positions").select("*");
  return { data: (data as Position[]) ?? [], error: error ? normalizeError(error) : null };
};

export const fetchAppState = async (): Promise<{ data: DbState | null; error: string | null }> => {
  ensureSupabase();

  const [usersRes, aspirantsRes, candidatesRes, positionsRes, votesRes, auditLogsRes, settingsRes] = await Promise.all([
    supabase.from("users").select("*").order("created_at", { ascending: false }),
    supabase.from("aspirants").select("*").order("created_at", { ascending: false }),
    supabase.from("candidates").select("*").order("created_at", { ascending: false }),
    supabase.from("positions").select("*").order("created_at", { ascending: false }),
    supabase.from("votes").select("*").order("created_at", { ascending: false }),
    supabase.from("audit_logs").select("*").order("created_at", { ascending: false }),
    supabase.from("election_settings").select("*").maybeSingle(),
  ]);

  const error = usersRes.error ?? aspirantsRes.error ?? candidatesRes.error ?? positionsRes.error ?? votesRes.error ?? auditLogsRes.error ?? settingsRes.error;
  if (error) return { data: null, error: normalizeError(error) };

  return {
    data: {
      users: (usersRes.data as User[]) ?? [],
      aspirants: (aspirantsRes.data as Aspirant[]) ?? [],
      candidates: (candidatesRes.data as Candidate[]) ?? [],
      positions: (positionsRes.data as Position[]) ?? [],
      votes: (votesRes.data as Vote[]) ?? [],
      auditLogs: (auditLogsRes.data as AuditLog[]) ?? [],
      settings: (settingsRes.data as ElectionSettings) ?? defaultSettings,
    },
    error: null,
  };
};

export const updateUserStatus = async (
  userId: string,
  status: ApprovalStatus,
  actor: SessionUser | null,
): Promise<string | null> => {
  ensureSupabase();
  const { error } = await supabase.from("users").update({ status }).eq("id", userId);
  const logError = await logAction(actor, `${status === "approved" ? "Approved" : "Rejected"} user`, "user", userId);
  return error ? normalizeError(error) : logError;
};

export const updateAspirant = async (
  aspirantId: string,
  patch: Partial<Aspirant>,
  actor: SessionUser | null,
): Promise<string | null> => {
  ensureSupabase();
  const { error } = await supabase.from("aspirants").update(patch).eq("id", aspirantId);
  const logError = await logAction(actor, `Updated aspirant`, "aspirant", aspirantId);
  return error ? normalizeError(error) : logError;
};

export const submitAspirantPayment = async (aspirantId: string, receipt: string): Promise<string | null> => {
  ensureSupabase();
  const { error } = await supabase
    .from("aspirants")
    .update({ payment_receipt: receipt, payment_submitted_at: new Date().toISOString(), payment_status: "pending" as PaymentStatus })
    .eq("id", aspirantId);
  if (error) return normalizeError(error);
  return null;
};

export const promoteAspirant = async (aspirantId: string, actor: SessionUser | null): Promise<string | null> => {
  ensureSupabase();

  const aspirantResult = await supabase.from("aspirants").select("*").eq("id", aspirantId).maybeSingle();
  if (aspirantResult.error) return normalizeError(aspirantResult.error);
  if (!aspirantResult.data) return "Aspirant not found.";

  const existingCandidate = await supabase.from("candidates").select("id").eq("aspirant_id", aspirantId).maybeSingle();
  if (existingCandidate.error) return normalizeError(existingCandidate.error);
  if (existingCandidate.data) return "Aspirant has already been promoted to candidate.";

  const aspirant = aspirantResult.data as DbAspirantRow;
  const candidateData: Omit<Candidate, "id" | "createdAt"> = {
    aspirantId: aspirant.id,
    fullName: aspirant.full_name,
    matricNumber: aspirant.matric_number,
    department: aspirant.department,
    level: aspirant.level,
    positionId: aspirant.position_id,
    manifesto: aspirant.manifesto,
    photo: aspirant.passport_image ?? undefined,
    isActive: true,
  };

  const candidateInsert = await supabase.from("candidates").insert(candidateData);
  if (candidateInsert.error) return normalizeError(candidateInsert.error);

  const userExists = await supabase.from("users").select("id").eq("id", aspirantId).maybeSingle();
  if (userExists.error) return normalizeError(userExists.error);

  if (!userExists.data) {
    const aspirant = aspirantResult.data as DbAspirantRow;
    const userInsert = await supabase.from("users").insert({
      id: aspirant.id,
      role: "student",
      full_name: aspirant.full_name,
      matric_number: aspirant.matric_number,
      department: aspirant.department,
      level: aspirant.level,
      password_hash: "supabase-auth",
      status: "approved",
      id_card_image: aspirant.id_card_image,
      has_voted: aspirant.has_voted,
    });
    if (userInsert.error) return normalizeError(userInsert.error);
  }

  const logError = await logAction(actor, `Promoted aspirant to candidate`, "candidate", aspirantId);
  return logError;
};

export const saveCandidate = async (candidate: Candidate, actor: SessionUser | null): Promise<string | null> => {
  ensureSupabase();
  const data = {
    aspirant_id: candidate.aspirantId ?? null,
    full_name: candidate.fullName,
    matric_number: candidate.matricNumber ?? null,
    department: candidate.department,
    level: candidate.level ?? null,
    position_id: candidate.positionId,
    manifesto: candidate.manifesto,
    photo: candidate.photo ?? null,
    is_active: candidate.isActive,
  };
  if (candidate.id) {
    const { error } = await supabase.from("candidates").update(data).eq("id", candidate.id);
    const logError = await logAction(actor, `Updated candidate ${candidate.fullName}`, "candidate", candidate.id);
    return error ? normalizeError(error) : logError;
  }
  const { error } = await supabase.from("candidates").insert(data);
  const logError = await logAction(actor, `Added candidate ${candidate.fullName}`, "candidate", candidate.id);
  return error ? normalizeError(error) : logError;
};

export const deleteCandidate = async (candidateId: string, actor: SessionUser | null): Promise<string | null> => {
  ensureSupabase();
  const voteDelete = await supabase.from("votes").delete().eq("candidate_id", candidateId);
  if (voteDelete.error) return normalizeError(voteDelete.error);
  const candidateDelete = await supabase.from("candidates").delete().eq("id", candidateId);
  if (candidateDelete.error) return normalizeError(candidateDelete.error);
  return await logAction(actor, "Deleted candidate", "candidate", candidateId);
};

export const savePosition = async (position: Position, actor: SessionUser | null): Promise<string | null> => {
  ensureSupabase();
  const payload = {
    title: position.title,
    form_price: position.formPrice,
    eligible_levels: position.eligibleLevels,
    max_selections: position.maxSelections,
    is_active: position.isActive,
  };
  if (position.id) {
    const { error } = await supabase.from("positions").update(payload).eq("id", position.id);
    const logError = await logAction(actor, `Updated position ${position.title}`, "position", position.id);
    return error ? normalizeError(error) : logError;
  }
  const { error } = await supabase.from("positions").insert(payload);
  const logError = await logAction(actor, `Added position ${position.title}`, "position");
  return error ? normalizeError(error) : logError;
};

export const deletePosition = async (positionId: string, actor: SessionUser | null): Promise<string | null> => {
  ensureSupabase();
  const votesDelete = await supabase.from("votes").delete().eq("position_id", positionId);
  if (votesDelete.error) return normalizeError(votesDelete.error);
  const candidatesDelete = await supabase.from("candidates").delete().eq("position_id", positionId);
  if (candidatesDelete.error) return normalizeError(candidatesDelete.error);
  const aspirantsUpdate = await supabase.from("aspirants").update({ position_id: null }).eq("position_id", positionId);
  if (aspirantsUpdate.error) return normalizeError(aspirantsUpdate.error);
  const positionDelete = await supabase.from("positions").delete().eq("id", positionId);
  if (positionDelete.error) return normalizeError(positionDelete.error);
  return await logAction(actor, "Deleted position", "position", positionId);
};

export const updateSettings = async (settings: ElectionSettings, actor: SessionUser | null): Promise<string | null> => {
  ensureSupabase();
  const payload = { ...settings, updated_at: new Date().toISOString() };
  const { error } = await supabase.from("election_settings").upsert(payload, { onConflict: "id" });
  if (error) return normalizeError(error);
  return await logAction(actor, "Changed election settings", "settings");
};

export const clearAuditLogs = async (actor: SessionUser | null): Promise<string | null> => {
  ensureSupabase();
  const { error } = await supabase.from("audit_logs").delete().not("id", "is", null);
  if (error) return normalizeError(error);
  return await logAction(actor, "Cleared audit trail", "settings");
};

export const castVotes = async (
  voter: SessionUser,
  selections: Record<string, string>,
): Promise<string | null> => {
  ensureSupabase();
  const ballots = Object.entries(selections).map(([positionId, candidateId]) => ({
    voter_id: voter.id,
    position_id: positionId,
    candidate_id: candidateId,
    department: voter.department,
    created_at: new Date().toISOString(),
  }));

  const insertResult = await supabase.from("votes").insert(ballots);
  if (insertResult.error) return normalizeError(insertResult.error);

  const userUpdate = await supabase.from("users").update({ has_voted: true }).eq("id", voter.id);
  if (userUpdate.error) return normalizeError(userUpdate.error);
  const aspirantUpdate = await supabase.from("aspirants").update({ has_voted: true }).eq("id", voter.id);
  if (aspirantUpdate.error) return normalizeError(aspirantUpdate.error);

  const logError = await logAction(voter, `Ballot submitted by ${voter.fullName}`, "vote", voter.id);
  return logError;
};

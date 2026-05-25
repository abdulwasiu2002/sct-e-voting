export type Role = "admin" | "student" | "aspirant";
export type ApprovalStatus = "pending" | "approved" | "rejected";
export type PaymentStatus = "pending" | "verified" | "rejected";

export interface User {
  id: string;
  role: Role;
  fullName: string;
  matricNumber?: string;
  department: string;
  level?: string;
  passwordHash: string;
  status: ApprovalStatus;
  idCardImage?: string;
  hasVoted: boolean;
  createdAt: string;
}

export interface Aspirant {
  id: string;
  fullName: string;
  matricNumber: string;
  department: string;
  level: string;
  passwordHash: string;
  positionId: string;
  gpa: number;
  manifesto: string;
  passportImage?: string;
  resultFile?: string;
  idCardImage?: string;
  paymentStatus: PaymentStatus;
  status: ApprovalStatus;
  createdAt: string;
}

export interface Candidate {
  id: string;
  aspirantId?: string;
  fullName: string;
  matricNumber?: string;
  department: string;
  level?: string;
  positionId: string;
  manifesto: string;
  photo?: string;
  isActive: boolean;
  createdAt: string;
}

export interface Vote {
  id: string;
  voterId: string;
  positionId: string;
  candidateId: string;
  department: string;
  createdAt: string;
}

export interface Position {
  id: string;
  title: string;
  formPrice: number;
  eligibleLevels: string[];
  maxSelections: number;
  isActive: boolean;
}

export interface AuditLog {
  id: string;
  actorId: string;
  actorName: string;
  action: string;
  entityType: "user" | "aspirant" | "candidate" | "position" | "settings" | "vote" | "auth";
  entityId?: string;
  createdAt: string;
}

export interface ElectionSettings {
  portalEnabled: boolean;
  startAt: string;
  endAt: string;
  departments: string[];
  levels: string[];
  updatedAt: string;
}

export interface DbState {
  users: User[];
  aspirants: Aspirant[];
  candidates: Candidate[];
  positions: Position[];
  votes: Vote[];
  auditLogs: AuditLog[];
  settings: ElectionSettings;
}

export interface SessionUser {
  id: string;
  role: Role;
  fullName: string;
  department: string;
}

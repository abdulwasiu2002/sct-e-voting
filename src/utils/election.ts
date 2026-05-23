import type { DbState } from "../types";

export const isElectionActive = (state: DbState, date = new Date()) => {
  const start = new Date(state.settings.startAt);
  const end = new Date(state.settings.endAt);
  return state.settings.portalEnabled && date >= start && date <= end;
};

export const turnoutPercent = (state: DbState) => {
  const approvedStudents = state.users.filter((user) => user.role === "student" && user.status === "approved").length;
  const votedStudents = new Set(state.votes.map((vote) => vote.voterId)).size;
  return approvedStudents === 0 ? 0 : Math.round((votedStudents / approvedStudents) * 100);
};

export const voteCountForCandidate = (state: DbState, candidateId: string) =>
  state.votes.filter((vote) => vote.candidateId === candidateId).length;

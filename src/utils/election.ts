import type { DbState } from "../types";

export const isElectionActive = (state: DbState, date = new Date()) => {
  const start = new Date(state.settings.startAt);
  const end = new Date(state.settings.endAt);
  return state.settings.portalEnabled && date >= start && date <= end;
};

export const turnoutPercent = (state: DbState) => {
  const eligibleVoters = getEligibleVoters(state).length;
  const votedStudents = getVotedVoterCount(state);
  return eligibleVoters === 0 ? 0 : Math.round((votedStudents / eligibleVoters) * 100);
};

export const voteCountForCandidate = (state: DbState, candidateId: string) =>
  state.votes.filter((vote) => vote.candidateId === candidateId).length;

export const getEligibleVoters = (state: DbState) => {
  const promotedMatricNumbers = new Set(state.candidates.map((candidate) => candidate.matricNumber?.toLowerCase()).filter(Boolean));
  const approvedStudents = state.users.filter((user) => user.role === "student" && user.status === "approved");
  const approvedAspirants = state.aspirants.filter(
    (aspirant) => aspirant.status === "approved" && !promotedMatricNumbers.has(aspirant.matricNumber.toLowerCase()),
  );
  return [...approvedStudents, ...approvedAspirants];
};

export const getVotedVoterCount = (state: DbState) => {
  const validVoterIds = new Set(getEligibleVoters(state).map((voter) => voter.id));
  return new Set(state.votes.filter((vote) => validVoterIds.has(vote.voterId)).map((vote) => vote.voterId)).size;
};

export const getTotalRegistrationCount = (state: DbState) => {
  const matricNumbers = new Set<string>();
  state.users.forEach((user) => {
    if (user.role === "student" && user.matricNumber) matricNumbers.add(user.matricNumber.toLowerCase());
  });
  state.aspirants.forEach((aspirant) => matricNumbers.add(aspirant.matricNumber.toLowerCase()));
  state.candidates.forEach((candidate) => {
    if (candidate.matricNumber) matricNumbers.add(candidate.matricNumber.toLowerCase());
  });
  return matricNumbers.size;
};

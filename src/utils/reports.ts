import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { DbState } from "../types";
import { downloadCsv } from "./files";
import { voteCountForCandidate } from "./election";

export const exportResultsPdf = (state: DbState) => {
  const doc = new jsPDF();
  doc.setFontSize(16);
  doc.text("School of Communication Technology", 14, 18);
  doc.setFontSize(12);
  doc.text("SCT E-Voting Final Results Report", 14, 26);
  doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 34);

  const rows = state.candidates
    .filter((candidate) => candidate.isActive)
    .map((candidate) => {
      const position = state.positions.find((item) => item.id === candidate.positionId);
      return [
        position?.title ?? "Unknown position",
        candidate.fullName,
        candidate.department,
        voteCountForCandidate(state, candidate.id),
      ];
    });

  autoTable(doc, {
    startY: 44,
    head: [["Position", "Candidate", "Department", "Votes"]],
    body: rows,
  });

  doc.save("sct-election-results.pdf");
};

export const exportResultsCsv = (state: DbState) => {
  const rows = state.candidates
    .filter((candidate) => candidate.isActive)
    .map((candidate) => ({
      Position: state.positions.find((item) => item.id === candidate.positionId)?.title ?? "Unknown position",
      Candidate: candidate.fullName,
      Department: candidate.department,
      Votes: voteCountForCandidate(state, candidate.id),
    }));
  downloadCsv("sct-election-results.csv", rows);
};

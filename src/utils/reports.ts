import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { Aspirant, DbState } from "../types";
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

export const exportAspirantFormPdf = (state: DbState, aspirant: Aspirant) => {
  const position = state.positions.find((item) => item.id === aspirant.positionId);
  const doc = new jsPDF();

  doc.setFontSize(16);
  doc.text("School of Communication Technology", 14, 18);
  doc.setFontSize(12);
  doc.text("Aspirant Nomination Form", 14, 27);
  doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 35);

  autoTable(doc, {
    startY: 45,
    head: [["Field", "Information"]],
    body: [
      ["Full name", aspirant.fullName],
      ["Matric number", aspirant.matricNumber],
      ["Department", aspirant.department],
      ["Level", aspirant.level],
      ["GPA", Number.isFinite(aspirant.gpa) ? aspirant.gpa.toFixed(2) : "Not provided"],
      ["Position", position?.title ?? "Not selected"],
      ["Manifesto", aspirant.manifesto],
    ],
    styles: { cellWidth: "wrap" },
    columnStyles: { 0: { cellWidth: 45 }, 1: { cellWidth: 130 } },
  });

  const finalY = (doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? 120;
  doc.text("Guarantor Information", 14, finalY + 18);
  doc.line(14, finalY + 30, 190, finalY + 30);
  doc.text("Guarantor name / department / phone", 14, finalY + 37);
  doc.line(14, finalY + 58, 95, finalY + 58);
  doc.text("Guarantor signature", 14, finalY + 65);
  doc.line(110, finalY + 58, 190, finalY + 58);
  doc.text("Aspirant signature", 110, finalY + 65);

  doc.save(`${aspirant.fullName.replace(/\s+/g, "-").toLowerCase()}-aspirant-form.pdf`);
};

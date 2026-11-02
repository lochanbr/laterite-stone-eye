import { jsPDF } from "jspdf";
import type { AnalysisResult } from "@/lib/types";
import { GRADE_META, PARAMETER_KEYS, PARAMETER_LABELS, type ParameterStatus } from "@/lib/types";

const STATUS_LABEL: Record<ParameterStatus, string> = {
  good: "OK",
  warning: "WARNING",
  bad: "BAD",
};

export function downloadReportPdf(
  result: AnalysisResult,
  imageDataUrl: string | null,
  createdAt: Date,
) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 40;
  const bottom = pageHeight - margin;
  let y = margin;
  const writeLines = (lines: string[]) => {
    for (const line of lines) {
      if (y + 13 > bottom) {
        doc.addPage();
        y = margin;
      }
      doc.text(line, margin, y);
      y += 13;
    }
  };

  // Header
  doc.setFillColor(26, 26, 26);
  doc.rect(0, 0, pageWidth, 70, "F");
  doc.setTextColor(193, 68, 14); // terracotta
  doc.setFontSize(24);
  doc.setFont("helvetica", "bold");
  doc.text("LateriteIQ", margin, 45);
  doc.setTextColor(212, 184, 150);
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.text("Stone Quality Inspection Report", margin, 60);

  y = 100;
  doc.setTextColor(60, 60, 60);
  doc.setFontSize(10);
  doc.text(`Generated: ${createdAt.toLocaleString()}`, margin, y);
  y += 20;

  // Image thumbnail
  if (imageDataUrl) {
    try {
      doc.addImage(imageDataUrl, "JPEG", margin, y, 160, 120, undefined, "FAST");
    } catch {
      // ignore image errors
    }
  }

  // Grade box (right of image)
  const meta = GRADE_META[result.grade];
  const gradeColors: Record<string, [number, number, number]> = {
    A: [76, 175, 80],
    B: [255, 193, 7],
    C: [255, 138, 50],
    D: [220, 53, 69],
  };
  const [r, g, b] = gradeColors[result.grade];
  const gradeX = margin + 180;
  doc.setFillColor(r, g, b);
  doc.roundedRect(gradeX, y, 120, 120, 8, 8, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(64);
  doc.setFont("helvetica", "bold");
  doc.text(result.grade, gradeX + 60, y + 75, { align: "center" });
  doc.setFontSize(11);
  doc.text(meta.label.toUpperCase(), gradeX + 60, y + 100, { align: "center" });

  y += 140;

  // Parameters table
  doc.setTextColor(26, 26, 26);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Quality Parameters", margin, y);
  y += 12;
  doc.setDrawColor(220, 220, 220);
  doc.line(margin, y, pageWidth - margin, y);
  y += 14;

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  for (const key of PARAMETER_KEYS) {
    const param = result[key];
    const label = PARAMETER_LABELS[key];
    const resultLines = doc.splitTextToSize(param.result, 220);
    if (y + Math.max(22, resultLines.length * 13) > bottom) {
      doc.addPage();
      y = margin;
    }
    doc.setTextColor(26, 26, 26);
    doc.setFont("helvetica", "bold");
    doc.text(label, margin, y);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(60, 60, 60);
    doc.text(resultLines, margin + 160, y);
    const statusColor: [number, number, number] =
      param.status === "good"
        ? [76, 175, 80]
        : param.status === "warning"
          ? [255, 152, 0]
          : [220, 53, 69];
    doc.setTextColor(...statusColor);
    doc.setFont("helvetica", "bold");
    doc.text(STATUS_LABEL[param.status] ?? param.status, pageWidth - margin, y, { align: "right" });
    y += Math.max(22, resultLines.length * 13);
  }

  y += 10;
  if (y + 30 > bottom) {
    doc.addPage();
    y = margin;
  }
  doc.setTextColor(26, 26, 26);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Summary", margin, y);
  y += 16;
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(60, 60, 60);
  const summaryLines = doc.splitTextToSize(result.summary, pageWidth - margin * 2);
  writeLines(summaryLines);
  y += 14;

  if (y + 30 > bottom) {
    doc.addPage();
    y = margin;
  }
  doc.setTextColor(26, 26, 26);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Recommendations", margin, y);
  y += 16;
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(60, 60, 60);
  for (const rec of result.recommendations) {
    const lines = doc.splitTextToSize(`• ${rec}`, pageWidth - margin * 2);
    writeLines(lines);
    y += 4;
  }

  doc.save(`lateriteiq-report-${createdAt.toISOString().slice(0, 10)}.pdf`);
}

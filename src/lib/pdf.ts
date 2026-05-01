import { jsPDF } from "jspdf";
import type { AnalysisResult } from "@/lib/types";
import { GRADE_META, PARAMETER_LABELS } from "@/lib/types";

const STATUS_LABEL: Record<string, string> = {
  good: "OK",
  warning: "WARNING",
  bad: "BAD",
};

export function downloadReportPdf(result: AnalysisResult, imageDataUrl: string | null, createdAt: Date) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 40;
  let y = margin;

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
  for (const [key, label] of Object.entries(PARAMETER_LABELS)) {
    const param = (result as any)[key] as { result: string; status: string };
    doc.setTextColor(26, 26, 26);
    doc.setFont("helvetica", "bold");
    doc.text(label, margin, y);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(60, 60, 60);
    doc.text(param.result, margin + 160, y, { maxWidth: 240 });
    const statusColor: [number, number, number] =
      param.status === "good" ? [76, 175, 80] : param.status === "warning" ? [255, 152, 0] : [220, 53, 69];
    doc.setTextColor(...statusColor);
    doc.setFont("helvetica", "bold");
    doc.text(STATUS_LABEL[param.status] ?? param.status, pageWidth - margin, y, { align: "right" });
    y += 22;
  }

  y += 10;
  doc.setTextColor(26, 26, 26);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Summary", margin, y);
  y += 16;
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(60, 60, 60);
  const summaryLines = doc.splitTextToSize(result.summary, pageWidth - margin * 2);
  doc.text(summaryLines, margin, y);
  y += summaryLines.length * 13 + 14;

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
    if (y + lines.length * 13 > doc.internal.pageSize.getHeight() - margin) {
      doc.addPage();
      y = margin;
    }
    doc.text(lines, margin, y);
    y += lines.length * 13 + 4;
  }

  doc.save(`lateriteiq-report-${createdAt.toISOString().slice(0, 10)}.pdf`);
}

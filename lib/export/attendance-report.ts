import * as XLSX from "xlsx";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import type { ModuleAttendanceReport } from "@/lib/api/server/reports";

// ── Excel Export ───────────────────────────────────────────────────────────

export function exportModuleAttendanceExcel(report: ModuleAttendanceReport) {
  const wb = XLSX.utils.book_new();

  // ─── Summary sheet ───────────────────────────────────────────────────────
  const summaryData = [
    ["Module Attendance Report"],
    [],
    ["Module Code", report.module_code],
    ["Module Name", report.module_name],
    ["Semester", report.semester ?? "N/A"],
    ["Credits", report.credits ?? "N/A"],
    ["Total Lectures", report.total_lectures],
    ["Total Students", report.total_students],
    ["Average Attendance Rate", `${report.avg_attendance_rate}%`],
    ["Generated On", new Date().toLocaleString()],
  ];

  const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
  // Style the title row
  summarySheet["!cols"] = [{ wch: 24 }, { wch: 36 }];
  XLSX.utils.book_append_sheet(wb, summarySheet, "Summary");

  // ─── Student Attendance sheet ────────────────────────────────────────────
  const headers = [
    "No.",
    "Index Number",
    "Student Name",
    "Batch",
    "Degree",
    "Present",
    "Absent",
    "Total Attended",
    "Total Lectures",
    "Attendance %",
  ];

  const rows = report.students.map((s, i) => [
    i + 1,
    s.index_number ?? "N/A",
    s.name,
    s.batch ?? "N/A",
    s.degree ?? "N/A",
    s.present_count,
    s.absent_count,
    s.attended_count,
    s.total_lectures,
    `${s.attendance_percentage}%`,
  ]);

  const studentSheet = XLSX.utils.aoa_to_sheet([headers, ...rows]);
  studentSheet["!cols"] = [
    { wch: 5 },
    { wch: 16 },
    { wch: 28 },
    { wch: 8 },
    { wch: 24 },
    { wch: 9 },
    { wch: 9 },
    { wch: 14 },
    { wch: 14 },
    { wch: 14 },
  ];
  XLSX.utils.book_append_sheet(wb, studentSheet, "Student Attendance");

  // ─── Detailed per-lecture sheet ──────────────────────────────────────────
  if (report.lectures.length > 0) {
    const detailHeaders = [
      "Index Number",
      "Student Name",
      ...report.lectures.map(
        (l) =>
          `${l.title} (${new Date(l.scheduled_at).toLocaleDateString()})`
      ),
    ];

    const detailRows = report.students.map((s) => [
      s.index_number ?? "N/A",
      s.name,
      ...s.lectures.map((la) => la.status ?? "ABSENT"),
    ]);

    const detailSheet = XLSX.utils.aoa_to_sheet([
      detailHeaders,
      ...detailRows,
    ]);
    detailSheet["!cols"] = [
      { wch: 16 },
      { wch: 28 },
      ...report.lectures.map(() => ({ wch: 18 })),
    ];
    XLSX.utils.book_append_sheet(wb, detailSheet, "Lecture Details");
  }

  // ─── Download ────────────────────────────────────────────────────────────
  const fileName = `${report.module_code}_Attendance_Report_${formatDate(new Date())}.xlsx`;
  XLSX.writeFile(wb, fileName);
}

// ── PDF Export ─────────────────────────────────────────────────────────────

export function exportModuleAttendancePDF(report: ModuleAttendanceReport) {
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();

  // ─── Header ──────────────────────────────────────────────────────────────
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("Module Attendance Report", pageWidth / 2, 18, { align: "center" });

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Generated on: ${new Date().toLocaleString()}`, pageWidth / 2, 25, {
    align: "center",
  });

  // ─── Module Info ─────────────────────────────────────────────────────────
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  const infoY = 34;
  doc.text(`${report.module_code} - ${report.module_name}`, 14, infoY);

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  const details = [
    `Semester: ${report.semester ?? "N/A"}`,
    `Credits: ${report.credits ?? "N/A"}`,
    `Total Lectures: ${report.total_lectures}`,
    `Total Students: ${report.total_students}`,
    `Average Attendance: ${report.avg_attendance_rate}%`,
  ].join("   |   ");
  doc.text(details, 14, infoY + 6);

  // ─── Attendance Table ────────────────────────────────────────────────────
  const tableHeaders = [
    "No.",
    "Index No.",
    "Student Name",
    "Batch",
    "Degree",
    "Present",
    "Absent",
    "Total",
    "Lectures",
    "Rate",
  ];

  const tableRows = report.students.map((s, i) => [
    String(i + 1),
    s.index_number ?? "N/A",
    s.name,
    s.batch != null ? String(s.batch) : "N/A",
    s.degree ?? "N/A",
    String(s.present_count),
    String(s.absent_count),
    String(s.attended_count),
    String(s.total_lectures),
    `${s.attendance_percentage}%`,
  ]);

  autoTable(doc, {
    startY: infoY + 12,
    head: [tableHeaders],
    body: tableRows,
    theme: "grid",
    headStyles: {
      fillColor: [5, 13, 31], // #050d1f deep navy matching the app theme
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 8,
      halign: "center",
    },
    bodyStyles: {
      fontSize: 8,
      halign: "center",
    },
    alternateRowStyles: {
      fillColor: [240, 243, 248],
    },
    columnStyles: {
      0: { cellWidth: 10 },
      1: { cellWidth: 24 },
      2: { cellWidth: 50, halign: "left" },
      3: { cellWidth: 16 },
      4: { cellWidth: 42, halign: "left" },
      5: { cellWidth: 18 },
      6: { cellWidth: 18 },
      7: { cellWidth: 16 },
      8: { cellWidth: 20 },
      9: { cellWidth: 18 },
    },
    didParseCell: (data) => {
      // Highlight low attendance in red
      if (data.section === "body" && data.column.index === 9) {
        const val = parseInt(data.cell.text[0]);
        if (val < 50) {
          data.cell.styles.textColor = [220, 38, 38];
          data.cell.styles.fontStyle = "bold";
        } else if (val < 75) {
          data.cell.styles.textColor = [234, 179, 8];
          data.cell.styles.fontStyle = "bold";
        }
      }
    },
  });

  // ─── Footer ──────────────────────────────────────────────────────────────
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setFont("helvetica", "italic");
    doc.text(
      `Page ${i} of ${pageCount}`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 8,
      { align: "center" }
    );
    doc.text(
      "AMS - Attendance Management System",
      14,
      doc.internal.pageSize.getHeight() - 8
    );
  }

  // ─── Download ────────────────────────────────────────────────────────────
  const fileName = `${report.module_code}_Attendance_Report_${formatDate(new Date())}.pdf`;
  doc.save(fileName);
}

// ── Helpers ────────────────────────────────────────────────────────────────

function formatDate(date: Date): string {
  return date.toISOString().split("T")[0];
}

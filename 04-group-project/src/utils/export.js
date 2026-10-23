import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

function toDateStr(item) {
  try {
    if (item.dateOfActivity?.toDate) return item.dateOfActivity.toDate().toLocaleDateString();
    if (item.dateOfActivity) return new Date(item.dateOfActivity).toLocaleDateString();
    return "";
  } catch {
    return "";
  }
}

export function exportPDF(data, title = "Institutional Achievement Report") {
  const docPdf = new jsPDF();
  docPdf.setFontSize(16);
  docPdf.text(title, 14, 16);
  docPdf.setFontSize(9);
  docPdf.setTextColor(120);
  docPdf.text(`Generated ${new Date().toLocaleString()} · ${data.length} record(s)`, 14, 22);

  autoTable(docPdf, {
    startY: 28,
    head: [["Name", "Role", "Department", "Category", "Title", "Status", "Date"]],
    body: data.map((d) => [
      d.submittedByName || "",
      d.role || "",
      d.department || "",
      d.category || "",
      d.title || "",
      d.status || "",
      toDateStr(d),
    ]),
    headStyles: { fillColor: [27, 35, 64] },
    styles: { fontSize: 8 },
  });

  docPdf.save(`report-${Date.now()}.pdf`);
}

export function exportExcel(data) {
  const rows = data.map((d) => ({
    Name: d.submittedByName || "",
    Role: d.role || "",
    Department: d.department || "",
    Category: d.category || "",
    Title: d.title || "",
    Description: d.description || "",
    Status: d.status || "",
    "Date of Activity": toDateStr(d),
    "Review Comment": d.reviewComment || "",
  }));

  const sheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, sheet, "Report");
  XLSX.writeFile(workbook, `report-${Date.now()}.xlsx`);
}

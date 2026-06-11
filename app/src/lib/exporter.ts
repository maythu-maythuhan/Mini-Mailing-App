import type { Recipient, SendSession } from "../types";

function csvCell(value: unknown): string {
  const s = value == null ? "" : String(value);
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function toCsv(headers: string[], rows: string[][]): string {
  const lines = [headers, ...rows].map((cols) => cols.map(csvCell).join(","));
  return "﻿" + lines.join("\r\n"); // BOM for Excel friendliness
}

export function downloadText(filename: string, text: string, mime = "text/csv") {
  const blob = new Blob([text], { type: `${mime};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function stamp(d = new Date()): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}`;
}

/** Full result report for the current recipient list. */
export function exportReport(recipients: Recipient[]) {
  const rows = recipients.map((r) => [
    r.name,
    r.email,
    r.company ?? "",
    r.sendStatus,
    r.error ?? "",
  ]);
  const csv = toCsv(["Name", "Email", "Company", "Status", "Error"], rows);
  downloadText(`invitation-report-${stamp()}.csv`, csv);
}

/** Only the failed rows, for quick re-import / follow-up. */
export function exportFailed(recipients: Recipient[]) {
  const failed = recipients.filter((r) => r.sendStatus === "failed");
  const rows = failed.map((r) => [r.name, r.email, r.company ?? "", r.error ?? ""]);
  const csv = toCsv(["Name", "Email", "Company", "Error"], rows);
  downloadText(`invitation-failed-${stamp()}.csv`, csv);
}

/** Current recipient list (name/email/company) as CSV — re-importable. */
export function exportRecipientsCsv(recipients: Recipient[]) {
  const rows = recipients.map((r) => [r.name, r.email, r.company ?? ""]);
  downloadText(`recipients-${stamp()}.csv`, toCsv(["Name", "Email", "Company"], rows));
}

/** Current recipient list as a real .xlsx workbook (xlsx loaded on demand). */
export async function exportRecipientsXlsx(recipients: Recipient[]) {
  const XLSX = await import("xlsx");
  const data = recipients.map((r) => ({ Name: r.name, Email: r.email, Company: r.company ?? "" }));
  const ws = XLSX.utils.json_to_sheet(data, { header: ["Name", "Email", "Company"] });
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Recipients");
  XLSX.writeFile(wb, `recipients-${stamp()}.xlsx`);
}

const TEMPLATE_ROWS = [
  { Name: "Daw Khin Myo", Email: "khin.myo@example.com", Company: "Partner Co., Ltd." },
  { Name: "U Aung Aung", Email: "aung.aung@example.com", Company: "" },
];

/** Blank import template (headers + two example rows) as CSV. */
export function downloadTemplateCsv() {
  const rows = TEMPLATE_ROWS.map((r) => [r.Name, r.Email, r.Company]);
  downloadText("recipients-template.csv", toCsv(["Name", "Email", "Company"], rows));
}

/** Blank import template as a real .xlsx workbook. */
export async function downloadTemplateXlsx() {
  const XLSX = await import("xlsx");
  const ws = XLSX.utils.json_to_sheet(TEMPLATE_ROWS, { header: ["Name", "Email", "Company"] });
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Recipients");
  XLSX.writeFile(wb, "recipients-template.xlsx");
}

/** Export one stored history session. */
export function exportSession(session: SendSession) {
  const rows = session.rows.map((r) => [
    r.name,
    r.email,
    r.company ?? "",
    r.status,
    r.error ?? "",
  ]);
  const csv = toCsv(["Name", "Email", "Company", "Status", "Error"], rows);
  downloadText(`session-${stamp(new Date(session.startedAt))}.csv`, csv);
}

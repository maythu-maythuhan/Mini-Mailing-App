import type { Recipient } from "../types";
import { uid } from "./id";

export interface ImportResult {
  rows: Array<Pick<Recipient, "name" | "email" | "company">>;
  /** Headers we detected, for user-friendly mapping feedback. */
  matched: { name: string | null; email: string | null; company: string | null };
  rawCount: number;
}

export class ImportError extends Error {}

const NAME_KEYS = ["name", "full name", "fullname", "recipient", "contact", "to"];
const EMAIL_KEYS = ["email", "e-mail", "mail", "email address", "address"];
const COMPANY_KEYS = ["company", "organization", "organisation", "org", "account"];

/**
 * Parse a CSV or XLSX File into recipient rows.
 * Maps Name / Email / optional Company columns by fuzzy header match
 * (PRD §12.4). Throws ImportError with a friendly message on bad input.
 */
export async function importFile(file: File): Promise<ImportResult> {
  const ext = file.name.split(".").pop()?.toLowerCase();
  if (!["csv", "xlsx", "xls"].includes(ext ?? "")) {
    throw new ImportError(
      "Unsupported file type. Please upload a .xlsx or .csv file.",
    );
  }

  // Lazy-load SheetJS only when a file is actually imported (keeps the
  // initial bundle small — PRD §11 Phase 5 scale readiness).
  const XLSX = await import("xlsx");

  let workbook: ReturnType<typeof XLSX.read>;
  try {
    const buf = await file.arrayBuffer();
    workbook = XLSX.read(buf, { type: "array" });
  } catch {
    throw new ImportError("We couldn't read that file. Is it a valid Excel or CSV file?");
  }

  const sheetName = workbook.SheetNames[0];
  if (!sheetName) throw new ImportError("The file has no sheets or rows.");

  const sheet = workbook.Sheets[sheetName];
  const records = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
    defval: "",
    raw: false,
  });

  if (records.length === 0) {
    throw new ImportError("No rows found. The file appears to be empty.");
  }

  const headers = Object.keys(records[0]);
  const nameCol = findColumn(headers, NAME_KEYS);
  const emailCol = findColumn(headers, EMAIL_KEYS);
  const companyCol = findColumn(headers, COMPANY_KEYS);

  if (!emailCol) {
    throw new ImportError(
      "Couldn't find an Email column. Make sure your file has a header named “Email”.",
    );
  }

  const rows = records
    .map((rec) => ({
      name: nameCol ? String(rec[nameCol] ?? "").trim() : "",
      email: emailCol ? String(rec[emailCol] ?? "").trim() : "",
      company: companyCol ? String(rec[companyCol] ?? "").trim() || undefined : undefined,
    }))
    .filter((r) => r.name || r.email); // drop fully blank rows

  if (rows.length === 0) {
    throw new ImportError("No recipient rows found after reading the file.");
  }

  return {
    rows,
    matched: { name: nameCol, email: emailCol, company: companyCol },
    rawCount: records.length,
  };
}

const EMAIL_IN_TEXT = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/;

/**
 * Parse free-text pasted recipients. One per line; each line may be:
 *   - "Name <email@x.com>"
 *   - "Name, email@x.com, Company"   (comma or tab separated, any order)
 *   - "email@x.com"                  (name left blank)
 * The email is detected by pattern; the first other field becomes the name.
 */
export function parsePastedText(
  text: string,
): Array<Pick<Recipient, "name" | "email" | "company">> {
  const out: Array<Pick<Recipient, "name" | "email" | "company">> = [];
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line) continue;

    // "Name <email>"
    const angle = line.match(/^(.*?)<\s*([^>]+?)\s*>$/);
    if (angle && EMAIL_IN_TEXT.test(angle[2])) {
      out.push({ name: angle[1].trim().replace(/[",]/g, "").trim(), email: angle[2].trim() });
      continue;
    }

    const parts = line.split(/[\t,;]+/).map((p) => p.trim()).filter(Boolean);
    const emailIdx = parts.findIndex((p) => EMAIL_IN_TEXT.test(p));
    if (emailIdx === -1) {
      // a bare email with surrounding words? try to extract one
      const m = line.match(EMAIL_IN_TEXT);
      if (m) out.push({ name: line.replace(m[0], "").replace(/[<>",]/g, "").trim(), email: m[0] });
      continue;
    }
    const email = parts[emailIdx];
    const rest = parts.filter((_, i) => i !== emailIdx);
    out.push({
      name: rest[0] ?? "",
      email,
      company: rest[1] || undefined,
    });
  }
  return out;
}

export function toRecipients(
  rows: Array<Pick<Recipient, "name" | "email" | "company">>,
  source: Recipient["source"],
): Recipient[] {
  return rows.map((r) => ({
    id: uid("r_"),
    name: r.name,
    email: r.email,
    company: r.company,
    source,
    sendStatus: "idle",
  }));
}

function findColumn(headers: string[], candidates: string[]): string | null {
  const norm = (s: string) => s.trim().toLowerCase();
  // exact match first
  for (const h of headers) if (candidates.includes(norm(h))) return h;
  // then contains
  for (const h of headers) {
    const n = norm(h);
    if (candidates.some((c) => n.includes(c))) return h;
  }
  return null;
}

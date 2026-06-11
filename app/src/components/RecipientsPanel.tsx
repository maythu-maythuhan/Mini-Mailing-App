import { useRef, useState, type ReactNode } from "react";
import { useCampaign } from "../state/campaign";
import type { Recipient, RowValidation, SendStatus } from "../types";
import { importFile, ImportError, parsePastedText } from "../lib/importer";
import {
  downloadTemplateCsv,
  downloadTemplateXlsx,
  exportRecipientsCsv,
  exportRecipientsXlsx,
} from "../lib/exporter";
import { useClickOutside } from "../lib/ui";
import {
  CheckIcon,
  ChevronIcon,
  DownloadIcon,
  FileIcon,
  InboxIcon,
  PlusIcon,
  RefreshIcon,
  TrashIcon,
  UploadIcon,
  UsersIcon,
} from "./icons";
import GroupMenu from "./GroupMenu";

export default function RecipientsPanel() {
  const { recipients, counts, validation } = useCampaign();
  const [pasteOpen, setPasteOpen] = useState(false);

  return (
    <section className="card">
      <div className="card__head">
        <span className="card__icon">
          <UsersIcon />
        </span>
        <div className="card__titles">
          <h2>Recipients</h2>
          <p>Add people, paste a list, or import a file — edit any cell inline, then send.</p>
        </div>
        <div className="card__head-actions">
          <GroupMenu />
        </div>
      </div>
      <div className="divider" />

      <div className="card__body">
        <Toolbar onPaste={() => setPasteOpen(true)} />

        {recipients.length === 0 ? (
          <EmptyState onPaste={() => setPasteOpen(true)} />
        ) : (
          <>
            <div className="counts">
              <span className="count"><b>{counts.total}</b> total</span>
              <span className="count count--ok"><b>{counts.sendable}</b> ready</span>
              {counts.invalidEmail > 0 && (
                <span className="count count--warn"><b>{counts.invalidEmail}</b> invalid email</span>
              )}
              {counts.missingName > 0 && (
                <span className="count count--amber"><b>{counts.missingName}</b> missing name</span>
              )}
              {counts.duplicate > 0 && (
                <span className="count count--amber"><b>{counts.duplicate}</b> duplicate</span>
              )}
            </div>
            <EditableTable recipients={recipients} validation={validation} />
          </>
        )}
      </div>

      {pasteOpen && <PasteModal onClose={() => setPasteOpen(false)} />}
    </section>
  );
}

/* ---------------- Toolbar ---------------- */
function Toolbar({ onPaste }: { onPaste: () => void }) {
  const {
    counts,
    recipients,
    addBlankRow,
    addImported,
    removeInvalid,
    removeDuplicates,
    includeAllValid,
    clearRecipients,
    notify,
  } = useCampaign();
  const fileRef = useRef<HTMLInputElement>(null);

  async function onFile(files: FileList | null) {
    if (!files?.[0]) return;
    try {
      const result = await importFile(files[0]);
      const n = addImported(result.rows);
      const cols = [result.matched.name && "Name", "Email", result.matched.company && "Company"]
        .filter(Boolean)
        .join(", ");
      notify("success", "List imported", `Added ${n} recipients (mapped ${cols}).`);
    } catch (e) {
      notify("error", "Import failed", e instanceof ImportError ? e.message : "Could not import that file.");
    }
  }

  const hasRecipients = recipients.length > 0;

  return (
    <div className="toolbar">
      <input
        ref={fileRef}
        type="file"
        accept=".csv,.xlsx,.xls"
        className="hidden-file"
        onChange={(e) => {
          onFile(e.target.files);
          e.target.value = "";
        }}
      />

      <button className="btn btn--primary btn--sm" onClick={addBlankRow}>
        <PlusIcon size={15} /> Add row
      </button>
      <button className="btn btn--ghost btn--sm" onClick={onPaste}>
        <FileIcon size={15} /> Paste list
      </button>

      <Dropdown
        label={
          <>
            <UploadIcon size={15} /> Import <ChevronIcon size={13} />
          </>
        }
      >
        {(close) => (
          <>
            <div className="menu__title">From file</div>
            <button
              className="menu__row"
              onClick={() => {
                close();
                fileRef.current?.click();
              }}
            >
              <UploadIcon size={15} />
              <span className="name">Import .xlsx / .csv…</span>
            </button>
            <div className="menu__title">Get a template</div>
            <button className="menu__row" onClick={() => { close(); downloadTemplateXlsx(); }}>
              <DownloadIcon size={15} />
              <span className="name">Excel template (.xlsx)</span>
            </button>
            <button className="menu__row" onClick={() => { close(); downloadTemplateCsv(); }}>
              <DownloadIcon size={15} />
              <span className="name">CSV template (.csv)</span>
            </button>
          </>
        )}
      </Dropdown>

      <div className="toolbar__spacer" />

      {hasRecipients && (
        <Dropdown
          label={
            <>
              <DownloadIcon size={15} /> Export <ChevronIcon size={13} />
            </>
          }
        >
          {(close) => (
            <>
              <div className="menu__title">Current list</div>
              <button className="menu__row" onClick={() => { close(); exportRecipientsXlsx(recipients); }}>
                <DownloadIcon size={15} />
                <span className="name">Export as Excel (.xlsx)</span>
              </button>
              <button className="menu__row" onClick={() => { close(); exportRecipientsCsv(recipients); }}>
                <DownloadIcon size={15} />
                <span className="name">Export as CSV (.csv)</span>
              </button>
            </>
          )}
        </Dropdown>
      )}

      {counts.invalidEmail + counts.missingName > 0 && (
        <button
          className="btn btn--danger btn--sm"
          onClick={() => notify("info", "Removed invalid rows", `${removeInvalid()} row(s) removed.`)}
        >
          <TrashIcon size={14} /> Remove invalid
        </button>
      )}
      {counts.duplicate > 0 && (
        <button
          className="btn btn--danger btn--sm"
          onClick={() => notify("info", "Removed duplicates", `${removeDuplicates()} removed.`)}
        >
          <TrashIcon size={14} /> Remove duplicates
        </button>
      )}
      {hasRecipients && (
        <>
          <button className="btn btn--ghost btn--sm" onClick={includeAllValid} title="Include all valid rows">
            <CheckIcon size={14} /> Select all valid
          </button>
          <button
            className="btn btn--subtle btn--sm"
            onClick={() => confirm("Remove all recipients?") && clearRecipients()}
          >
            Clear all
          </button>
        </>
      )}
    </div>
  );
}

/* ---------------- Generic dropdown ---------------- */
function Dropdown({
  label,
  children,
}: {
  label: ReactNode;
  children: (close: () => void) => ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const wrap = useRef<HTMLDivElement>(null);
  useClickOutside(wrap, () => setOpen(false), open);
  return (
    <div className="menu-wrap" ref={wrap}>
      <button className="btn btn--ghost btn--sm" onClick={() => setOpen((o) => !o)}>
        {label}
      </button>
      {open && <div className="menu" style={{ width: 240 }}>{children(() => setOpen(false))}</div>}
    </div>
  );
}

/* ---------------- Editable grid ---------------- */
function EditableTable({
  recipients,
  validation,
}: {
  recipients: Recipient[];
  validation: Map<string, RowValidation>;
}) {
  const { selectedId, setSelectedId, excludedIds, toggleExclude, updateRecipient, removeRecipient, sending } =
    useCampaign();

  return (
    <div className="tablewrap" style={{ marginTop: 12 }}>
      <div className="rtable__scroll">
        <table className="rtable">
          <thead>
            <tr>
              <th style={{ width: 34 }}></th>
              <th>Name</th>
              <th>Email</th>
              <th>Company</th>
              <th>Validation</th>
              <th>Send</th>
              <th style={{ width: 36 }}></th>
            </tr>
          </thead>
          <tbody>
            {recipients.map((r) => {
              const v = validation.get(r.id)!;
              const checked = v.sendable && !excludedIds.has(r.id);
              const emailBad = r.email.trim().length > 0 && !v.validEmail;
              return (
                <tr key={r.id} className={r.id === selectedId ? "is-selected" : ""}>
                  <td>
                    <input
                      type="checkbox"
                      className="rcheck"
                      checked={checked}
                      disabled={!v.sendable || sending}
                      onChange={() => toggleExclude(r.id)}
                      title={v.sendable ? "Include in Send All" : "Not sendable"}
                    />
                  </td>
                  <td>
                    <input
                      className="cell-input cell-name"
                      value={r.name}
                      placeholder="Name"
                      disabled={sending}
                      onFocus={() => setSelectedId(r.id)}
                      onChange={(e) => updateRecipient(r.id, { name: e.target.value })}
                    />
                  </td>
                  <td>
                    <input
                      className={`cell-input ${emailBad ? "is-bad" : ""}`}
                      value={r.email}
                      placeholder="name@company.com"
                      disabled={sending}
                      onFocus={() => setSelectedId(r.id)}
                      onChange={(e) => updateRecipient(r.id, { email: e.target.value })}
                    />
                  </td>
                  <td>
                    <input
                      className="cell-input"
                      value={r.company ?? ""}
                      placeholder="—"
                      disabled={sending}
                      onFocus={() => setSelectedId(r.id)}
                      onChange={(e) => updateRecipient(r.id, { company: e.target.value || undefined })}
                    />
                  </td>
                  <td>{validationPill(v)}</td>
                  <td>{sendPill(r.sendStatus, r.error)}</td>
                  <td>
                    <button
                      className="iconaction"
                      title="Remove recipient"
                      onClick={() => removeRecipient(r.id)}
                      disabled={sending}
                    >
                      <TrashIcon size={15} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function validationPill(v: RowValidation) {
  if (!v.validEmail) return <span className="pill pill--bad"><span className="dot" /> Invalid email</span>;
  if (v.missingName) return <span className="pill pill--warn"><span className="dot" /> Missing name</span>;
  if (v.duplicate) return <span className="pill pill--warn"><span className="dot" /> Duplicate</span>;
  return <span className="pill pill--ok"><CheckIcon size={12} /> Ready</span>;
}

function sendPill(status: SendStatus, error?: string) {
  switch (status) {
    case "sent":
      return <span className="pill pill--ok"><CheckIcon size={12} /> Sent</span>;
    case "failed":
      return <span className="pill pill--bad" title={error}><span className="dot" /> Failed</span>;
    case "sending":
      return <span className="pill pill--live"><span className="spinner" /> Sending</span>;
    case "queued":
      return <span className="pill pill--neutral"><RefreshIcon size={12} /> Queued</span>;
    default:
      return <span className="pill pill--neutral">—</span>;
  }
}

/* ---------------- Paste modal ---------------- */
function PasteModal({ onClose }: { onClose: () => void }) {
  const { addManyManual, notify } = useCampaign();
  const [text, setText] = useState("");
  const preview = parsePastedText(text);

  function add() {
    if (preview.length === 0) {
      notify("info", "Nothing to add", "Paste at least one line with an email address.");
      return;
    }
    addManyManual(preview);
    notify("success", "Recipients added", `Added ${preview.length} from pasted text.`);
    onClose();
  }

  return (
    <div className="overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" role="dialog" aria-modal="true" aria-label="Paste recipients" style={{ maxWidth: 560 }}>
        <div className="modal__bar">
          <span className="modal__title" style={{ marginLeft: 0 }}>Paste recipients</span>
          <button className="modal__close" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>
        <div style={{ padding: "18px 22px" }}>
          <p className="muted" style={{ marginTop: 0 }}>
            One person per line. Any of these work:
            <br />
            <code>Daw Khin Myo, khin@example.com, Partner Co.</code>
            <br />
            <code>U Aung &lt;aung@example.com&gt;</code> &nbsp;·&nbsp; <code>just@email.com</code>
          </p>
          <textarea
            className="paste-area"
            autoFocus
            placeholder={"Daw Khin Myo, khin.myo@example.com, Partner Co.\nU Aung Aung <aung@example.com>\nguest@example.com"}
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <div className="muted" style={{ marginTop: 8 }}>
            {preview.length > 0 ? `${preview.length} recipient(s) detected` : "Detected recipients will appear in the list."}
          </div>
        </div>
        <div className="modal__actions">
          <button className="btn btn--ghost" style={{ flex: 1 }} onClick={onClose}>
            Cancel
          </button>
          <button className="btn btn--primary" style={{ flex: 1.3 }} onClick={add} disabled={preview.length === 0}>
            <PlusIcon size={16} /> Add {preview.length > 0 ? preview.length : ""} to list
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------------- Empty ---------------- */
function EmptyState({ onPaste }: { onPaste: () => void }) {
  const { addBlankRow, addImported, notify } = useCampaign();
  const fileRef = useRef<HTMLInputElement>(null);

  async function onFile(files: FileList | null) {
    if (!files?.[0]) return;
    try {
      const result = await importFile(files[0]);
      notify("success", "List imported", `Added ${addImported(result.rows)} recipients.`);
    } catch (e) {
      notify("error", "Import failed", e instanceof ImportError ? e.message : "Could not import that file.");
    }
  }

  return (
    <div className="empty">
      <div className="empty__art">
        <InboxIcon size={26} />
      </div>
      <h3>No recipients yet</h3>
      <p>Add a row, paste a list, or import an Excel / CSV file to begin.</p>
      <input
        ref={fileRef}
        type="file"
        accept=".csv,.xlsx,.xls"
        className="hidden-file"
        onChange={(e) => {
          onFile(e.target.files);
          e.target.value = "";
        }}
      />
      <div style={{ display: "flex", gap: 8, justifyContent: "center", marginTop: 14, flexWrap: "wrap" }}>
        <button className="btn btn--primary btn--sm" onClick={addBlankRow}>
          <PlusIcon size={15} /> Add row
        </button>
        <button className="btn btn--ghost btn--sm" onClick={onPaste}>
          <FileIcon size={15} /> Paste list
        </button>
        <button className="btn btn--ghost btn--sm" onClick={() => fileRef.current?.click()}>
          <UploadIcon size={15} /> Import file
        </button>
      </div>
    </div>
  );
}

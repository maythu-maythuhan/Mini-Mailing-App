import { useRef, useState } from "react";
import { useCampaign } from "../state/campaign";
import { formatBytes } from "../lib/ui";
import { FileIcon, PaperclipIcon, TrashIcon, UploadIcon } from "./icons";

export default function AttachmentsCard() {
  const { attachments, addAttachments, removeAttachment, notify } = useCampaign();
  const inputRef = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    // Guard against very large attachments in demo (base64 in memory).
    const tooBig = Array.from(files).find((f) => f.size > 10 * 1024 * 1024);
    if (tooBig) {
      notify("error", "File too large", `${tooBig.name} exceeds the 10 MB demo limit.`);
      return;
    }
    await addAttachments(files);
    notify("success", "Attachment added", `${files.length} file(s) attached to this invitation.`);
  }

  return (
    <section className="card">
      <div className="card__head">
        <span className="card__icon">
          <PaperclipIcon />
        </span>
        <div className="card__titles">
          <h2>Attachments</h2>
          <p>Optional files included with every invitation.</p>
        </div>
        <div className="card__head-actions">
          <button className="btn btn--ghost btn--sm" onClick={() => inputRef.current?.click()}>
            <UploadIcon size={15} /> Add files
          </button>
        </div>
      </div>
      <div className="divider" />
      <div className="card__body">
        <input
          ref={inputRef}
          type="file"
          multiple
          className="hidden-file"
          onChange={(e) => {
            handleFiles(e.target.files);
            e.target.value = "";
          }}
        />

        {attachments.length === 0 ? (
          <div
            className={`dropzone ${over ? "is-over" : ""}`}
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              setOver(true);
            }}
            onDragLeave={() => setOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setOver(false);
              handleFiles(e.dataTransfer.files);
            }}
          >
            <PaperclipIcon size={22} />
            <div style={{ marginTop: 8 }}>
              Drag files here, or <b>browse</b> to attach.
            </div>
          </div>
        ) : (
          <div className="attach-list">
            {attachments.map((a) => (
              <div className="attach" key={a.id}>
                <span className="attach__icon">
                  <FileIcon size={17} />
                </span>
                <div className="attach__meta">
                  <div className="attach__name">{a.name}</div>
                  <div className="attach__size">{formatBytes(a.size)}</div>
                </div>
                <button
                  className="iconaction"
                  title="Remove attachment"
                  onClick={() => removeAttachment(a.id)}
                >
                  <TrashIcon size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

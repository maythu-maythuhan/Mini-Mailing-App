import { useRef, useState } from "react";
import { useCampaign } from "../state/campaign";
import { useClickOutside, formatDate } from "../lib/ui";
import { ChevronIcon, FileIcon, TrashIcon } from "./icons";

export default function TemplateMenu() {
  const { templates, saveTemplate, deleteTemplate, applyTemplate, draft } = useCampaign();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const wrap = useRef<HTMLDivElement>(null);
  useClickOutside(wrap, () => setOpen(false), open);

  const canSave = draft.subject.trim().length > 0 || draft.body.trim().length > 0;

  function save() {
    const n = name.trim();
    if (!n) return;
    saveTemplate(n);
    setName("");
  }

  return (
    <div className="menu-wrap" ref={wrap}>
      <button className="btn btn--ghost btn--sm" onClick={() => setOpen((o) => !o)}>
        <FileIcon size={15} /> Templates <ChevronIcon size={14} />
      </button>

      {open && (
        <div className="menu">
          <div className="menu__title">Saved templates</div>
          {templates.length === 0 ? (
            <div className="menu__empty">No templates yet. Save your current draft below.</div>
          ) : (
            templates.map((t) => (
              <div className="menu__row" key={t.id}>
                <button
                  className="menu__load"
                  onClick={() => {
                    applyTemplate(t);
                    setOpen(false);
                  }}
                >
                  <span className="name">{t.name}</span>
                  <span className="sub">Updated {formatDate(t.updatedAt)}</span>
                </button>
                <button
                  className="iconaction"
                  title="Delete template"
                  onClick={() => deleteTemplate(t.id)}
                >
                  <TrashIcon size={15} />
                </button>
              </div>
            ))
          )}

          <div className="menu__save">
            <input
              className="input"
              placeholder="Save current as…"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && save()}
              disabled={!canSave}
            />
            <button className="btn btn--primary btn--sm" onClick={save} disabled={!canSave || !name.trim()}>
              Save
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

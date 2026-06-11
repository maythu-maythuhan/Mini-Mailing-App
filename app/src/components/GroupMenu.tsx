import { useRef, useState } from "react";
import { useCampaign } from "../state/campaign";
import { useClickOutside } from "../lib/ui";
import { ChevronIcon, LayersIcon, TrashIcon, UsersIcon } from "./icons";

export default function GroupMenu() {
  const { groups, saveGroup, deleteGroup, loadGroup, recipients } = useCampaign();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const wrap = useRef<HTMLDivElement>(null);
  useClickOutside(wrap, () => setOpen(false), open);

  function save() {
    const n = name.trim();
    if (!n) return;
    saveGroup(n);
    setName("");
  }

  return (
    <div className="menu-wrap" ref={wrap}>
      <button className="btn btn--ghost btn--sm" onClick={() => setOpen((o) => !o)}>
        <LayersIcon size={15} /> Groups <ChevronIcon size={14} />
      </button>

      {open && (
        <div className="menu">
          <div className="menu__title">Saved groups</div>
          {groups.length === 0 ? (
            <div className="menu__empty">No groups yet. Save your current list below to reuse later.</div>
          ) : (
            groups.map((g) => (
              <div className="menu__row" key={g.id}>
                <button
                  className="menu__load"
                  onClick={() => {
                    loadGroup(g);
                    setOpen(false);
                  }}
                >
                  <span className="name">
                    <UsersIcon size={13} /> {g.name}
                  </span>
                  <span className="sub">{g.recipients.length} recipients</span>
                </button>
                <button className="iconaction" title="Delete group" onClick={() => deleteGroup(g.id)}>
                  <TrashIcon size={15} />
                </button>
              </div>
            ))
          )}

          <div className="menu__save">
            <input
              className="input"
              placeholder="Save list as group…"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && save()}
              disabled={recipients.length === 0}
            />
            <button
              className="btn btn--primary btn--sm"
              onClick={save}
              disabled={recipients.length === 0 || !name.trim()}
            >
              Save
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

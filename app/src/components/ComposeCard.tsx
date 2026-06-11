import { useRef } from "react";
import { useCampaign } from "../state/campaign";
import { PenIcon } from "./icons";
import TemplateMenu from "./TemplateMenu";

const PLACEHOLDERS = ["{{Name}}", "{{Company}}"];

export default function ComposeCard() {
  const { draft, setDraft } = useCampaign();
  const bodyRef = useRef<HTMLTextAreaElement>(null);

  function insertPlaceholder(token: string) {
    const el = bodyRef.current;
    if (!el) {
      setDraft({ ...draft, body: draft.body + token });
      return;
    }
    const start = el.selectionStart ?? draft.body.length;
    const end = el.selectionEnd ?? draft.body.length;
    const next = draft.body.slice(0, start) + token + draft.body.slice(end);
    setDraft({ ...draft, body: next });
    requestAnimationFrame(() => {
      el.focus();
      const pos = start + token.length;
      el.setSelectionRange(pos, pos);
    });
  }

  return (
    <section className="card">
      <div className="card__head">
        <span className="card__icon">
          <PenIcon />
        </span>
        <div className="card__titles">
          <h2>Compose</h2>
          <p>Write one subject and message. It personalizes for each recipient.</p>
        </div>
        <div className="card__head-actions">
          <TemplateMenu />
        </div>
      </div>
      <div className="divider" />
      <div className="card__body">
        <div className="field">
          <label className="label" htmlFor="subject">
            Subject <span className="req">*</span>
          </label>
          <input
            id="subject"
            className="input"
            placeholder="You're invited: HEINEKEN Myanmar Partner Evening"
            value={draft.subject}
            onChange={(e) => setDraft({ ...draft, subject: e.target.value })}
          />
        </div>

        <div className="field">
          <label className="label" htmlFor="body">
            Message <span className="req">*</span>
          </label>
          <textarea
            id="body"
            ref={bodyRef}
            className="textarea"
            placeholder={
              "Dear {{Name}},\n\nWe would be delighted to welcome you to our upcoming event...\n\nWarm regards,\nHEINEKEN Myanmar"
            }
            value={draft.body}
            onChange={(e) => setDraft({ ...draft, body: e.target.value })}
          />
          <div className="chips">
            {PLACEHOLDERS.map((p) => (
              <button
                key={p}
                type="button"
                className="chip"
                onClick={() => insertPlaceholder(p)}
                title={`Insert ${p}`}
              >
                {p}
              </button>
            ))}
          </div>
          <p className="chips__hint">
            Click a tag to insert it. Each recipient sees their own details.
          </p>
        </div>
      </div>
    </section>
  );
}

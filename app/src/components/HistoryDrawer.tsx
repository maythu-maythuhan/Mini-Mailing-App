import { useCampaign } from "../state/campaign";
import { exportSession } from "../lib/exporter";
import { formatDate } from "../lib/ui";
import { ClockIcon, DownloadIcon, XIcon } from "./icons";

export default function HistoryDrawer({ onClose }: { onClose: () => void }) {
  const { history, clearHistory } = useCampaign();

  return (
    <div className="drawer-overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <aside className="drawer" role="dialog" aria-label="Send history">
        <div className="drawer__head">
          <span className="card__icon">
            <ClockIcon />
          </span>
          <h2>Send history</h2>
          {history.length > 0 && (
            <button className="btn btn--subtle btn--sm" onClick={clearHistory}>
              Clear
            </button>
          )}
          <button className="iconbtn" onClick={onClose} aria-label="Close">
            <XIcon />
          </button>
        </div>
        <div className="drawer__body">
          {history.length === 0 ? (
            <div className="empty" style={{ marginTop: 8 }}>
              <div className="empty__art">
                <ClockIcon size={26} />
              </div>
              <h3>No sessions yet</h3>
              <p>Each Send All run is recorded here so you can review and export it later.</p>
            </div>
          ) : (
            history.map((s) => (
              <div className="session" key={s.id}>
                <div className="session__top">
                  <span className="session__subject">{s.subject || "(no subject)"}</span>
                  {s.cancelled && <span className="pill pill--warn">Cancelled</span>}
                </div>
                <div className="session__date">
                  {formatDate(s.startedAt)} · from {s.from}
                </div>
                <div className="session__stats">
                  <span className="pill pill--neutral">{s.total} total</span>
                  <span className="pill pill--ok">{s.sent} sent</span>
                  {s.failed > 0 && <span className="pill pill--bad">{s.failed} failed</span>}
                </div>
                <div className="session__foot">
                  <button className="btn btn--ghost btn--sm" onClick={() => exportSession(s)}>
                    <DownloadIcon size={14} /> Export CSV
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </aside>
    </div>
  );
}

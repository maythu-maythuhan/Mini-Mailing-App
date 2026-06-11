import { useCampaign } from "../state/campaign";
import { exportFailed, exportReport } from "../lib/exporter";
import {
  AlertIcon,
  CheckIcon,
  DownloadIcon,
  PauseIcon,
  PlayIcon,
  RefreshIcon,
  SendIcon,
  StopIcon,
} from "./icons";

/** Live progress while sending, switching to a result summary when done. */
export default function SendConsole() {
  const {
    progress,
    pauseSend,
    resumeSend,
    cancelSend,
    dismissProgress,
    startSend,
    failedIds,
    recipients,
  } = useCampaign();

  if (!progress) return null;

  const { total, sent, failed, remaining, currentName, status } = progress;
  const done = status === "done" || status === "cancelled";
  const processed = sent + failed;
  const pct = total > 0 ? Math.round((processed / total) * 100) : 0;
  const allOk = done && failed === 0;

  return (
    <div className="overlay" onMouseDown={(e) => done && e.target === e.currentTarget && dismissProgress()}>
      <div className="console" role="dialog" aria-modal="true" aria-label="Send progress">
        <div className="console__head">
          <div
            className={`console__icon ${
              !done ? "console__icon--run" : allOk ? "console__icon--done" : "console__icon--warn"
            }`}
          >
            {!done ? (
              <SendIcon size={24} />
            ) : allOk ? (
              <CheckIcon size={26} />
            ) : (
              <AlertIcon size={24} />
            )}
          </div>
          <h2>
            {!done
              ? status === "paused"
                ? "Sending paused"
                : "Sending invitations…"
              : status === "cancelled"
                ? "Sending cancelled"
                : allOk
                  ? "All invitations sent"
                  : "Finished with some failures"}
          </h2>
          <p>
            {!done
              ? "Emails are going out one by one from your mailbox."
              : `${sent} delivered · ${failed} failed of ${total}.`}
          </p>
        </div>

        <div className="console__body">
          <div className="progress">
            <div
              className={`progress__bar ${failed > 0 ? "progress__bar--mixed" : ""}`}
              style={{ width: `${pct}%` }}
            />
          </div>
          <div className="current">
            {!done && currentName ? (
              <>
                Now sending to <b>{currentName}</b> · {processed} of {total}
              </>
            ) : !done ? (
              <>Preparing…</>
            ) : (
              <>{pct}% processed</>
            )}
          </div>

          <div className="statgrid">
            <div className="stat">
              <div className="stat__n">{total}</div>
              <div className="stat__l">Total</div>
            </div>
            <div className="stat stat--sent">
              <div className="stat__n">{sent}</div>
              <div className="stat__l">Sent</div>
            </div>
            <div className="stat stat--failed">
              <div className="stat__n">{failed}</div>
              <div className="stat__l">Failed</div>
            </div>
            <div className="stat">
              <div className="stat__n">{remaining}</div>
              <div className="stat__l">Remaining</div>
            </div>
          </div>

          {/* live controls */}
          {!done && (
            <div className="console__actions">
              {status === "paused" ? (
                <button className="btn btn--ghost" onClick={resumeSend}>
                  <PlayIcon size={15} /> Resume
                </button>
              ) : (
                <button className="btn btn--ghost" onClick={pauseSend}>
                  <PauseIcon size={15} /> Pause
                </button>
              )}
              <button className="btn btn--danger" onClick={cancelSend}>
                <StopIcon size={15} /> Cancel
              </button>
            </div>
          )}

          {/* completion actions */}
          {done && (
            <div className="console__actions" style={{ flexWrap: "wrap" }}>
              <button className="btn btn--ghost" onClick={() => exportReport(recipients)}>
                <DownloadIcon size={15} /> Export report
              </button>
              {failed > 0 && (
                <>
                  <button className="btn btn--ghost" onClick={() => exportFailed(recipients)}>
                    <DownloadIcon size={15} /> Export failed
                  </button>
                  <button
                    className="btn btn--primary"
                    onClick={() => {
                      dismissProgress();
                      startSend(failedIds);
                    }}
                  >
                    <RefreshIcon size={15} /> Retry failed only
                  </button>
                </>
              )}
              <button className="btn btn--primary" onClick={dismissProgress}>
                Done
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

import type { Toast } from "../types";
import { AlertIcon, CheckIcon, InfoIcon } from "./icons";

export default function Toasts({ toasts }: { toasts: Toast[] }) {
  return (
    <div className="toasts">
      {toasts.map((t) => (
        <div key={t.id} className={`toast toast--${t.kind}`}>
          <span className="toast__icon">
            {t.kind === "success" ? (
              <CheckIcon size={16} />
            ) : t.kind === "error" ? (
              <AlertIcon size={16} />
            ) : (
              <InfoIcon size={16} />
            )}
          </span>
          <div>
            <div className="toast__title">{t.title}</div>
            {t.message && <div className="toast__msg">{t.message}</div>}
          </div>
        </div>
      ))}
    </div>
  );
}

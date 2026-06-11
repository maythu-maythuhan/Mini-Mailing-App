import { useState } from "react";
import { useAuth } from "../auth/useAuth";
import { StarIcon } from "./icons";

function MsLogo() {
  return (
    <svg width="18" height="18" viewBox="0 0 21 21" aria-hidden>
      <rect x="1" y="1" width="9" height="9" fill="#F25022" />
      <rect x="11" y="1" width="9" height="9" fill="#7FBA00" />
      <rect x="1" y="11" width="9" height="9" fill="#00A4EF" />
      <rect x="11" y="11" width="9" height="9" fill="#FFB900" />
    </svg>
  );
}

export default function SignIn() {
  const { signInDemo, connectMicrosoft, configured, config } = useAuth();
  const [busy, setBusy] = useState<"ms" | "demo" | null>(null);
  const [showConfig, setShowConfig] = useState(false);
  const [clientId, setClientId] = useState(config.clientId);
  const [tenantId, setTenantId] = useState(config.tenantId);
  const [error, setError] = useState<string | null>(null);

  async function microsoft() {
    if (!configured && !showConfig) {
      setShowConfig(true);
      return;
    }
    if (showConfig && !clientId.trim()) {
      setError("Paste your Application (client) ID to continue.");
      return;
    }
    setError(null);
    setBusy("ms");
    try {
      await connectMicrosoft(
        showConfig ? { clientId: clientId.trim(), tenantId: tenantId.trim() || "common" } : undefined,
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Sign-in was cancelled.");
    } finally {
      setBusy(null);
    }
  }

  async function demo() {
    setBusy("demo");
    try {
      await signInDemo();
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="signin">
      <div className="signin__card">
        <div className="signin__mark">
          <StarIcon size={28} />
        </div>
        <h1>Invitation Sender</h1>
        <p>
          Send personalized invitations from your own HEINEKEN Myanmar mailbox —
          prepared, previewed, and tested with care.
        </p>

        {showConfig && (
          <div className="signin__config">
            <label className="label">Application (client) ID</label>
            <input
              className="input"
              placeholder="00000000-0000-0000-0000-000000000000"
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
            />
            <label className="label" style={{ marginTop: 10 }}>
              Directory (tenant) ID <span className="opt">· or “common”</span>
            </label>
            <input
              className="input"
              placeholder="your-tenant-id or common"
              value={tenantId}
              onChange={(e) => setTenantId(e.target.value)}
            />
          </div>
        )}

        <button className="ms-btn" onClick={microsoft} disabled={busy !== null}>
          {busy === "ms" ? (
            <>
              <span className="spinner" style={{ borderTopColor: "#00843d", borderColor: "rgba(0,132,61,.25)" }} />
              Connecting…
            </>
          ) : (
            <>
              <MsLogo />
              {showConfig ? "Connect & sign in" : "Sign in with Microsoft"}
            </>
          )}
        </button>

        {error && <div className="signin__error">{error}</div>}

        <button className="signin__demolink" onClick={demo} disabled={busy !== null}>
          {busy === "demo" ? "Loading…" : "Or explore in demo mode →"}
        </button>

        <p className="signin__note">
          You send from your own signed-in mailbox. Emails go out one by one — never as a CC/BCC blast.
        </p>
      </div>
    </div>
  );
}

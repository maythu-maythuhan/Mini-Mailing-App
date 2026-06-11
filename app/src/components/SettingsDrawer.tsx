import { useState } from "react";
import { useCampaign } from "../state/campaign";
import { useAuth } from "../auth/useAuth";
import { CheckIcon, GearIcon, XIcon } from "./icons";

// Microsoft four-square logo.
function MsLogo({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 21 21" aria-hidden>
      <rect x="1" y="1" width="9" height="9" fill="#F25022" />
      <rect x="11" y="1" width="9" height="9" fill="#7FBA00" />
      <rect x="1" y="11" width="9" height="9" fill="#00A4EF" />
      <rect x="11" y="11" width="9" height="9" fill="#FFB900" />
    </svg>
  );
}

export default function SettingsDrawer({ onClose }: { onClose: () => void }) {
  const { settings, updateSettings, notify } = useCampaign();
  const { user, isReal, config, setConfig, connectMicrosoft, signOut } = useAuth();

  const [clientId, setClientId] = useState(config.clientId);
  const [tenantId, setTenantId] = useState(config.tenantId);
  const [busy, setBusy] = useState(false);

  async function connect() {
    if (!clientId.trim()) {
      notify("error", "Client ID required", "Paste the Application (client) ID from Azure.");
      return;
    }
    setBusy(true);
    try {
      await connectMicrosoft({ clientId: clientId.trim(), tenantId: tenantId.trim() || "common" });
      notify("success", "Microsoft connected", "Real sending is now enabled for your mailbox.");
    } catch (e) {
      notify("error", "Couldn't connect", e instanceof Error ? e.message : "Sign-in was cancelled.");
    } finally {
      setBusy(false);
    }
  }

  function saveConfig() {
    setConfig({ clientId: clientId.trim(), tenantId: tenantId.trim() || "common" });
    notify("success", "Saved", "Microsoft connection details saved on this device.");
  }

  return (
    <div className="drawer-overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <aside className="drawer" role="dialog" aria-label="Settings">
        <div className="drawer__head">
          <span className="card__icon">
            <GearIcon />
          </span>
          <h2>Settings</h2>
          <button className="iconbtn" onClick={onClose} aria-label="Close">
            <XIcon />
          </button>
        </div>
        <div className="drawer__body">
          {/* Microsoft connection */}
          <div className="setrow">
            <h3 style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <MsLogo /> Microsoft connection
            </h3>

            {isReal ? (
              <>
                <div className="conn-status">
                  <span className="pill pill--ok">
                    <CheckIcon size={12} /> Connected
                  </span>
                  <span className="muted">Sending as {user?.email}</span>
                </div>
                <p className="muted" style={{ marginTop: 12 }}>
                  Emails are sent for real from your mailbox via Microsoft Graph.
                </p>
                <button className="btn btn--danger btn--sm" style={{ marginTop: 6 }} onClick={() => signOut()}>
                  Disconnect & sign out
                </button>
              </>
            ) : (
              <>
                <p>
                  Connect your Azure app registration to send real emails. There is no API key —
                  you sign in and send with your own mailbox permission.
                </p>
                <label className="label">Application (client) ID</label>
                <input
                  className="input"
                  placeholder="00000000-0000-0000-0000-000000000000"
                  value={clientId}
                  onChange={(e) => setClientId(e.target.value)}
                />
                <label className="label" style={{ marginTop: 12 }}>
                  Directory (tenant) ID <span className="opt">· or “common”</span>
                </label>
                <input
                  className="input"
                  placeholder="your-tenant-id or common"
                  value={tenantId}
                  onChange={(e) => setTenantId(e.target.value)}
                />
                <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
                  <button className="btn btn--ghost btn--sm" onClick={saveConfig}>
                    Save
                  </button>
                  <button className="btn btn--primary btn--sm" onClick={connect} disabled={busy}>
                    {busy ? <span className="spinner" /> : <MsLogo />} Connect Microsoft account
                  </button>
                </div>
                <p className="muted" style={{ marginTop: 12 }}>
                  Your Azure app must be a <b>Single-page application</b> with redirect URI{" "}
                  <code>{window.location.origin}</code> and delegated permissions{" "}
                  <b>Mail.Send</b> + <b>User.Read</b>.
                </p>
              </>
            )}
          </div>

          {/* Sending behaviour */}
          <div className="setrow">
            <h3>Delay between sends</h3>
            <p>A small pause between each email keeps sending gentle and reliable.</p>
            <div className="range-row">
              <input
                type="range"
                min={0}
                max={2000}
                step={100}
                value={settings.sendDelayMs}
                onChange={(e) => updateSettings({ sendDelayMs: Number(e.target.value) })}
              />
              <span className="range-val">{settings.sendDelayMs} ms</span>
            </div>
          </div>

          <div className="setrow">
            <h3>High-volume warning</h3>
            <p>Show an extra confirmation when sending to more than this many recipients.</p>
            <div className="range-row">
              <input
                type="range"
                min={10}
                max={500}
                step={10}
                value={settings.highVolumeThreshold}
                onChange={(e) => updateSettings({ highVolumeThreshold: Number(e.target.value) })}
              />
              <span className="range-val">{settings.highVolumeThreshold}</span>
            </div>
          </div>

          <p className="muted" style={{ marginTop: 18 }}>
            Settings, templates, groups, and send history are stored locally on this device.
          </p>
        </div>
      </aside>
    </div>
  );
}

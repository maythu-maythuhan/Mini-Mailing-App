import {
  PublicClientApplication,
  InteractionRequiredAuthError,
  type AccountInfo,
} from "@azure/msal-browser";
import type { Attachment, GraphConfig, User } from "../types";

/**
 * Microsoft Graph integration for real sending (delegated, as the signed-in
 * user). Uses MSAL.js in a browser SPA flow — there is no API key; the user
 * signs in and the app sends with their own Mail.Send permission.
 *
 * Azure app registration requirements:
 *  - Platform: Single-page application (SPA)
 *  - Redirect URI: this app's origin (e.g. http://localhost:5173)
 *  - Delegated Graph permissions: User.Read, Mail.Send
 */
const SCOPES = ["User.Read", "Mail.Send"];

let pca: PublicClientApplication | null = null;
let configKey = "";

async function ensureApp(config: GraphConfig): Promise<PublicClientApplication> {
  const key = `${config.clientId}|${config.tenantId}`;
  if (pca && key === configKey) return pca;
  const authority = `https://login.microsoftonline.com/${config.tenantId || "common"}`;
  pca = new PublicClientApplication({
    auth: {
      clientId: config.clientId,
      authority,
      redirectUri: window.location.origin,
    },
    cache: { cacheLocation: "localStorage" },
  });
  await pca.initialize();
  configKey = key;
  return pca;
}

function accountToUser(account: AccountInfo): User {
  return {
    name: account.name || account.username,
    email: account.username,
  };
}

/** Interactive sign-in. Returns the connected user. */
export async function connect(config: GraphConfig): Promise<User> {
  if (!config.clientId) throw new Error("Missing Client ID.");
  const app = await ensureApp(config);
  const result = await app.loginPopup({ scopes: SCOPES, prompt: "select_account" });
  app.setActiveAccount(result.account);
  return accountToUser(result.account);
}

/** Restore a previously connected account silently (no popup), if present. */
export async function restore(config: GraphConfig): Promise<User | null> {
  if (!config.clientId) return null;
  const app = await ensureApp(config);
  const active = app.getActiveAccount() ?? app.getAllAccounts()[0] ?? null;
  if (!active) return null;
  app.setActiveAccount(active);
  return accountToUser(active);
}

/** Acquire an access token, falling back to an interactive popup if needed. */
export async function getToken(): Promise<string> {
  if (!pca) throw new Error("Microsoft connection not initialized.");
  const account = pca.getActiveAccount() ?? pca.getAllAccounts()[0];
  if (!account) throw new Error("No signed-in Microsoft account.");
  try {
    const r = await pca.acquireTokenSilent({ scopes: SCOPES, account });
    return r.accessToken;
  } catch (e) {
    if (e instanceof InteractionRequiredAuthError) {
      const r = await pca.acquireTokenPopup({ scopes: SCOPES, account });
      return r.accessToken;
    }
    throw e;
  }
}

export async function disconnect(): Promise<void> {
  if (!pca) return;
  const account = pca.getActiveAccount() ?? undefined;
  try {
    await pca.clearCache({ account });
  } catch {
    /* ignore */
  }
  pca.setActiveAccount(null);
}

/** Send one personalised email via Graph. Subject/body are already rendered. */
export async function sendViaGraph(
  token: string,
  to: { name: string; email: string },
  subject: string,
  body: string,
  attachments: Attachment[] = [],
): Promise<{ ok: boolean; error?: string }> {
  const message: Record<string, unknown> = {
    subject,
    body: { contentType: "Text", content: body },
    toRecipients: [{ emailAddress: { address: to.email, name: to.name || undefined } }],
  };

  if (attachments.length > 0) {
    message.attachments = attachments.map((a) => ({
      "@odata.type": "#microsoft.graph.fileAttachment",
      name: a.name,
      contentType: a.type,
      contentBytes: a.dataUrl.includes(",") ? a.dataUrl.split(",")[1] : a.dataUrl,
    }));
  }

  try {
    const res = await fetch("https://graph.microsoft.com/v1.0/me/sendMail", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ message, saveToSentItems: true }),
    });

    if (res.ok || res.status === 202) return { ok: true };

    let detail = `Graph error ${res.status}`;
    try {
      const data = await res.json();
      detail = data?.error?.message || detail;
    } catch {
      /* ignore parse */
    }
    return { ok: false, error: detail };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Network error." };
  }
}

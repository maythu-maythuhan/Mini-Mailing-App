import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { AuthMode, GraphConfig, User } from "../types";
import { store } from "../lib/storage";
import * as graph from "../lib/graph";

const DEMO_KEY = "hmm.demo.user";

interface AuthValue {
  user: User | null;
  mode: AuthMode | null;
  /** True when sending will go through real Microsoft Graph. */
  isReal: boolean;
  /** Microsoft connection is configured (Client ID present). */
  configured: boolean;
  config: GraphConfig;
  setConfig: (c: GraphConfig) => void;

  signInDemo: () => Promise<void>;
  connectMicrosoft: (config?: GraphConfig) => Promise<void>;
  signOut: () => Promise<void>;

  /** Access token for Graph when connected; null in demo mode. */
  getAccessToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [mode, setMode] = useState<AuthMode | null>(null);
  const [config, setConfigState] = useState<GraphConfig>(() => store.getGraphConfig());

  // Restore a previous session on load.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const savedMode = store.getMode();
      if (savedMode === "graph") {
        try {
          const u = await graph.restore(store.getGraphConfig());
          if (!cancelled && u) {
            setUser(u);
            setMode("graph");
            return;
          }
        } catch {
          /* fall through to demo */
        }
      }
      const raw = localStorage.getItem(DEMO_KEY);
      if (raw && !cancelled) {
        try {
          setUser(JSON.parse(raw) as User);
          setMode("demo");
        } catch {
          localStorage.removeItem(DEMO_KEY);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const setConfig = useCallback((c: GraphConfig) => {
    setConfigState(c);
    store.saveGraphConfig(c);
  }, []);

  const signInDemo = useCallback(async () => {
    await new Promise((r) => setTimeout(r, 500));
    const demoUser: User = { name: "Su Su Aung", email: "su.aung@heineken.com.mm" };
    localStorage.setItem(DEMO_KEY, JSON.stringify(demoUser));
    store.saveMode("demo");
    setUser(demoUser);
    setMode("demo");
  }, []);

  const connectMicrosoft = useCallback(
    async (override?: GraphConfig) => {
      const cfg = override ?? config;
      if (override) setConfig(override);
      const u = await graph.connect(cfg);
      store.saveMode("graph");
      setUser(u);
      setMode("graph");
    },
    [config, setConfig],
  );

  const signOut = useCallback(async () => {
    if (mode === "graph") {
      await graph.disconnect().catch(() => {});
    }
    localStorage.removeItem(DEMO_KEY);
    store.saveMode(null);
    setUser(null);
    setMode(null);
  }, [mode]);

  const getAccessToken = useCallback(async () => {
    if (mode !== "graph") return null;
    return graph.getToken();
  }, [mode]);

  const value = useMemo<AuthValue>(
    () => ({
      user,
      mode,
      isReal: mode === "graph",
      configured: config.clientId.trim().length > 0,
      config,
      setConfig,
      signInDemo,
      connectMicrosoft,
      signOut,
      getAccessToken,
    }),
    [user, mode, config, setConfig, signInDemo, connectMicrosoft, signOut, getAccessToken],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

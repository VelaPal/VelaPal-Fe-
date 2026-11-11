"use client";

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { SWRConfig } from "swr";
import { authService } from "@/services/contracts/auth.service";
import {
  cancelWorkspaceRequests,
  clearCsrfToken,
  setCsrfToken,
} from "@/services/contracts/api-client";
import type {
  AuthenticatedSession,
  Workspace,
} from "@/services/contracts/types";

type SessionContext = {
  session: AuthenticatedSession | null;
  loading: boolean;
  error: Error | null;
  workspaces: Workspace[];
  accept: (s: AuthenticatedSession) => void;
  restore: () => Promise<void>;
  logout: () => Promise<void>;
  switchWorkspace: (id: string, stepUpId?: string) => Promise<void>;
};
const Context = createContext<SessionContext | null>(null);
export function useSession() {
  const value = useContext(Context);
  if (!value) throw new Error("Session provider missing");
  return value;
}

export function SessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthenticatedSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [revision, setRevision] = useState(0);
  const generation = useRef(0);
  const router = useRouter();
  function accept(s: AuthenticatedSession) {
    generation.current++;
    cancelWorkspaceRequests();
    setCsrfToken(s.csrfToken);
    setSession(s);
    setWorkspaces([s.activeWorkspace]);
    setLoading(false);
    setError(null);
    setRevision((v) => v + 1);
  }
  async function restore() {
    const requestGeneration = ++generation.current;
    setLoading(true);
    setError(null);
    try {
      const restored = await authService.restoreSession();
      if (requestGeneration === generation.current) {
        setCsrfToken(restored.csrfToken);
        cancelWorkspaceRequests();
        setSession(restored);
        setRevision((v) => v + 1);
      }
    } catch (e) {
      if (requestGeneration === generation.current) {
        clearCsrfToken();
        cancelWorkspaceRequests();
        setSession(null);
        setError(e instanceof Error ? e : new Error("Session recovery failed"));
      }
    } finally {
      if (requestGeneration === generation.current) setLoading(false);
    }
  }
  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    const requestGeneration = generation.current;
    void authService
      .restoreSession(controller.signal)
      .then((s) => {
        if (active && requestGeneration === generation.current) {
          setCsrfToken(s.csrfToken);
          setSession(s);
        }
      })
      .catch((e) => {
        if (active && requestGeneration === generation.current) {
          setSession(null);
          setError(
            e instanceof Error ? e : new Error("Session recovery failed"),
          );
        }
      })
      .finally(() => {
        if (active && requestGeneration === generation.current)
          setLoading(false);
      });
    const expired = () => {
      generation.current++;
      cancelWorkspaceRequests();
      clearCsrfToken();
      setSession(null);
      setLoading(false);
      setWorkspaces([]);
      setRevision((v) => v + 1);
      router.replace("/login");
    };
    window.addEventListener("velapal:session-expired", expired);
    return () => {
      active = false;
      controller.abort();
      window.removeEventListener("velapal:session-expired", expired);
    };
    // Session recovery runs once; individual 401 responses invalidate it afterward.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    if (session) {
      let active = true;
      void authService
        .listWorkspaces()
        .then((r) => {
          if (active) setWorkspaces(r.items);
        })
        .catch((e) => {
          if (active)
            setError(
              e instanceof Error ? e : new Error("Workspace list unavailable"),
            );
        });
      return () => {
        active = false;
      };
    }
  }, [session]);
  async function logout() {
    await authService.logout();
    generation.current++;
    cancelWorkspaceRequests();
    setSession(null);
    setWorkspaces([]);
    setRevision((v) => v + 1);
    router.replace("/login");
  }
  async function switchWorkspace(id: string, stepUpId?: string) {
    generation.current++;
    setLoading(true);
    cancelWorkspaceRequests();
    try {
      const next = await authService.switchWorkspace(id, stepUpId);
      cancelWorkspaceRequests();
      if (session) setSession({ ...session, ...next });
      setError(null);
      setRevision((v) => v + 1);
      router.replace("/workspace");
    } catch (cause) {
      // A transport failure may occur after the server switches context. Require
      // session recovery before rendering either workspace again.
      clearCsrfToken();
      cancelWorkspaceRequests();
      setSession(null);
      setWorkspaces([]);
      setRevision((v) => v + 1);
      setError(
        cause instanceof Error
          ? cause
          : new Error(
              "Workspace switch could not be confirmed. Recover your session.",
            ),
      );
      throw cause;
    } finally {
      setLoading(false);
    }
  }
  return (
    <Context.Provider
      value={{
        session,
        loading,
        error,
        workspaces,
        accept,
        restore,
        logout,
        switchWorkspace,
      }}
    >
      <SWRConfig
        key={`${session?.activeWorkspace.workspaceId ?? "anonymous"}:${revision}`}
        value={{
          provider: () => new Map(),
          shouldRetryOnError: false,
          revalidateOnFocus: true,
        }}
      >
        {children}
      </SWRConfig>
    </Context.Provider>
  );
}

export function ProtectedWorkspace({ children }: { children: ReactNode }) {
  const { session, loading, error, restore } = useSession();
  const router = useRouter();
  useEffect(() => {
    if (
      !loading &&
      !session &&
      (!error || ("status" in error && error.status === 401))
    )
      router.replace("/login");
  }, [session, loading, error, router]);
  if (loading)
    return (
      <p role="status" className="p-8">
        Recovering your secure session…
      </p>
    );
  if (!session)
    return (
      <div className="p-8">
        <p role="alert">{error?.message || "Sign in to continue."}</p>
        <button className="vp-button" onClick={() => void restore()}>
          Retry session recovery
        </button>
      </div>
    );
  return children;
}

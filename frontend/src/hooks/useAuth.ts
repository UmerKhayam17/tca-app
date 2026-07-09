import { useEffect, useState } from "react";
import { getSession, restoreSession, restoreSessionOnce, refreshAccessToken, SessionUser } from "@/lib/auth";

export type AuthState = {
  user: SessionUser | null;
  /** True until first session restore attempt finishes */
  loading: boolean;
};

export const useAuth = (): AuthState => {
  const [user, setUser] = useState<SessionUser | null>(() => getSession());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const sync = () => setUser(getSession());
    window.addEventListener("tces-auth-change", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("tces-auth-change", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const restored = await restoreSessionOnce();
      if (cancelled) return;
      setUser(restored);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!user) return;

    const onVisible = () => {
      if (document.visibilityState !== "visible") return;
      void (async () => {
        await refreshAccessToken();
        const restored = await restoreSession();
        setUser(restored);
      })();
    };

    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [user?.id]);

  return { user, loading };
};

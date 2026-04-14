import { useState, useEffect, useCallback } from "react";
import type { AuthUser } from "@workspace/api-client-react";

export type { AuthUser };

interface AuthState {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (returnTo?: string) => void;
  logout: () => void;
}

export function useAuth(): AuthState {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    // Add a cache-buster query param to force skip Vercel/CDN edge caches
    const cacheBuster = `t=${Date.now()}`;
    fetch(`/api/auth/user?${cacheBuster}`, {
      credentials: "include",
      cache: "no-store",
      headers: {
        "cache-control": "no-store",
      },
    })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json() as Promise<{ user: AuthUser | null }>;
      })
      .then((data) => {
        if (!cancelled) {
          console.log(`[Auth Hook] User check result:`, data.user ? `Authenticated (${data.user.email})` : "Not Authenticated");
          setUser(data.user ?? null);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        console.warn(`[Auth Hook] Session check failed:`, err);
        if (!cancelled) {
          setUser(null);
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback((returnTo?: string) => {
    const currentUrl = new URL(window.location.href);
    const destination = returnTo || (currentUrl.pathname + currentUrl.search + currentUrl.hash) || "/";
    
    console.log(`[Auth Hook] Initiating login, returnTo: ${destination}`);
    window.location.href = `/api/login?returnTo=${encodeURIComponent(destination)}`;
  }, []);

  const logout = useCallback(() => {
    window.location.href = "/api/logout";
  }, []);

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    logout,
  };
}

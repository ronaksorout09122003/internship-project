"use client";

import type { ReactNode } from "react";
import { createContext, useCallback, useEffect, useMemo, useState } from "react";
import { getCurrentUser } from "@/services/auth-service";
import type { AuthContextValue, AuthResponse, User } from "@/types/auth";
import {
  clearStoredToken,
  clearStoredUser,
  getStoredToken,
  getStoredUser,
  setStoredToken,
  setStoredUser
} from "@/utils/storage";

export const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const savedToken = getStoredToken();
    const savedUser = getStoredUser();

    if (!savedToken) {
      setIsLoading(false);
      return;
    }

    setToken(savedToken);
    if (savedUser) {
      setUser(savedUser);
    }

    void (async () => {
      try {
        const currentUser = await getCurrentUser();
        setUser(currentUser);
        setStoredUser(currentUser);
      } catch {
        clearStoredToken();
        clearStoredUser();
        setToken(null);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const login = useCallback((payload: AuthResponse) => {
    setStoredToken(payload.accessToken);
    setStoredUser(payload.user);
    setToken(payload.accessToken);
    setUser(payload.user);
  }, []);

  const logout = useCallback(() => {
    clearStoredToken();
    clearStoredUser();
    setToken(null);
    setUser(null);
  }, []);

  const refreshUser = useCallback(async () => {
    const currentUser = await getCurrentUser();
    setUser(currentUser);
    setStoredUser(currentUser);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      isLoading,
      login,
      logout,
      refreshUser
    }),
    [user, token, isLoading, login, logout, refreshUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

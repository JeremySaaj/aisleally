"use client";

import { useState, useCallback } from "react";
import type { AuthState } from "@/types/auth";

/**
 * Custom hook for managing AisleAlly authentication state.
 *
 * For the MVP this is a simple client-side stub — no real backend.
 * Designed to be replaced with actual auth logic (e.g., NextAuth, Supabase)
 * without changing the component interface.
 */
export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    email: "",
    isAuthenticated: false,
  });

  const handleAuth = useCallback((email: string) => {
    setAuthState({
      email,
      isAuthenticated: true,
    });
  }, []);

  const handleLogout = useCallback(() => {
    setAuthState({
      email: "",
      isAuthenticated: false,
    });
  }, []);

  return {
    authState,
    handleAuth,
    handleLogout,
  };
}

"use client";

import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import type { HealthProfile } from "@/types/auth";

/* ---------- Context shape ---------- */
interface HealthProfileContextValue {
  profile: HealthProfile | null;
  isLoading: boolean;
  /** Call after saving a new profile to update the context immediately */
  refreshProfile: () => void;
}

const STORAGE_KEY = "aisleally-profile";

const HealthProfileContext = createContext<HealthProfileContextValue>({
  profile: null,
  isLoading: true,
  refreshProfile: () => {},
});

/* ---------- Provider ---------- */
export function HealthProfileProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<HealthProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadProfile = () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        setProfile(JSON.parse(raw) as HealthProfile);
      } else {
        setProfile(null);
      }
    } catch {
      setProfile(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
    // Listen for storage changes from other tabs
    const handleStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) loadProfile();
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  return (
    <HealthProfileContext.Provider value={{ profile, isLoading, refreshProfile: loadProfile }}>
      {children}
    </HealthProfileContext.Provider>
  );
}

/* ---------- Consumer hook ---------- */
export function useHealthProfile() {
  return useContext(HealthProfileContext);
}

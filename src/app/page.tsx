"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Route: / (entry gate)
 *
 * The app always enters through the login flow:
 *  - Unauthenticated users are redirected to /login
 *  - Authenticated users (aisleally-user-id in localStorage) go to /home
 */
export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    const userId = localStorage.getItem("aisleally-user-id");
    router.replace(userId ? "/home" : "/login");
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <p className="text-sm text-slate-500">Loading AisleAlly…</p>
    </div>
  );
}
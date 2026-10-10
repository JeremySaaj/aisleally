"use client";

import { useState, useCallback, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import CustomSectionCard from "@/components/ui/CustomSectionCard";
import PrimaryActionButton from "@/components/ui/PrimaryActionButton";
import { validateLoginForm } from "@/lib/validation";
import type { LoginFormErrors, AuthProps } from "@/types/auth";

const BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? "";

export default function LoginForm({ onAuth }: AuthProps) {
  const router = useRouter();

  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors]     = useState<LoginFormErrors>({});
  const [authError, setAuthError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = useCallback(
    async (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      setAuthError(null);

      const formErrors = validateLoginForm(email, password);
      if (Object.keys(formErrors).length > 0) {
        setErrors(formErrors);
        return;
      }
      setErrors({});
      setIsSubmitting(true);

      try {
        const res = await fetch(`${BASE_URL}/api/auth`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });

        if (res.status === 401) {
          setAuthError("Incorrect email or password.");
          return;
        }
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          setAuthError(body.detail ?? "Something went wrong. Please try again.");
          return;
        }

        const data = await res.json();
        // Store the Supabase user UUID as the stable identifier
        localStorage.setItem("aisleally-user-id", data.user_id);

        onAuth?.(email);

        // Route by is_new_user from the auth response
        router.push(data.is_new_user ? "/health-focus" : "/home");
      } catch {
        setAuthError("Network error. Please check your connection.");
      } finally {
        setIsSubmitting(false);
      }
    },
    [email, password, onAuth, router],
  );

  return (
    <CustomSectionCard title="Sign in to AisleAlly">
      <form onSubmit={handleSubmit} noValidate className="space-y-5">

        {/* ---- Global auth error ---- */}
        {authError && (
          <div role="alert" className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">
            {authError}
          </div>
        )}

        {/* ---- Email Field ---- */}
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1.5">
            Email address
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }));
              setAuthError(null);
            }}
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? "email-error" : undefined}
            className={`
              w-full rounded-xl border px-4 py-3 text-slate-800 text-base
              placeholder:text-slate-400
              focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400
              transition-colors duration-150
              ${errors.email ? "border-red-400 bg-red-50" : "border-slate-300 bg-white"}
            `}
          />
          {errors.email && (
            <p id="email-error" role="alert" className="mt-1.5 text-sm text-red-500">{errors.email}</p>
          )}
        </div>

        {/* ---- Password Field ---- */}
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1.5">
            Password
          </label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (errors.password) setErrors((prev) => ({ ...prev, password: undefined }));
              setAuthError(null);
            }}
            aria-invalid={!!errors.password}
            aria-describedby={errors.password ? "password-error" : undefined}
            className={`
              w-full rounded-xl border px-4 py-3 text-slate-800 text-base
              placeholder:text-slate-400
              focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400
              transition-colors duration-150
              ${errors.password ? "border-red-400 bg-red-50" : "border-slate-300 bg-white"}
            `}
          />
          {errors.password && (
            <p id="password-error" role="alert" className="mt-1.5 text-sm text-red-500">{errors.password}</p>
          )}
        </div>

        {/* ---- Submit ---- */}
        <div className="pt-2">
          <PrimaryActionButton label="Sign In" type="submit" isLoading={isSubmitting} />
        </div>

        {/* ---- Helper Text ---- */}
        <p className="text-center text-xs text-slate-500 pt-1 leading-relaxed">
          Don&apos;t have an account?{" "}
          <Link
            href="/signup"
            className="font-medium text-emerald-600 hover:text-emerald-500 hover:underline"
          >
            Sign up
          </Link>
        </p>
      </form>
    </CustomSectionCard>
  );
}

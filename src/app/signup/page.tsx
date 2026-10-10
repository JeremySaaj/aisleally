"use client";

import { useState, useCallback, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import CustomSectionCard from "@/components/ui/CustomSectionCard";
import PrimaryActionButton from "@/components/ui/PrimaryActionButton";
import { validateSignupForm } from "@/lib/validation";
import type { SignupFormErrors } from "@/types/auth";

const BASE_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL ?? "https://aisleally-backend.vercel.app";

/**
 * Route: /signup
 *
 * Dedicated sign-up screen. Collects full name, email and password, then
 * creates the account via POST /api/auth/signup. On success the Supabase
 * user UUID and display name are stored in localStorage and the user is
 * taken to the health-focus setup screen.
 */
export default function SignupPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<SignupFormErrors>({});
  const [authError, setAuthError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = useCallback(
    async (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      setAuthError(null);

      const formErrors = validateSignupForm(name, email, password);
      if (Object.keys(formErrors).length > 0) {
        setErrors(formErrors);
        return;
      }
      setErrors({});
      setIsSubmitting(true);

      try {
        const res = await fetch(`${BASE_URL}/api/auth/signup`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: name.trim(),
            email: email.trim(),
            password,
          }),
        });

        if (res.status === 409) {
          const body = await res.json().catch(() => ({}));
          setAuthError(
            body.detail ??
              "An account with this email already exists. Please log in instead.",
          );
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
        localStorage.setItem("aisleally-user-name", data.name ?? name.trim());

        router.push("/health-focus");
      } catch {
        setAuthError("Network error. Please check your connection.");
      } finally {
        setIsSubmitting(false);
      }
    },
    [name, email, password, router],
  );

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <CustomSectionCard title="Create your AisleAlly account">
        <form onSubmit={handleSubmit} noValidate className="space-y-5">

          {/* ---- Global error ---- */}
          {authError && (
            <div role="alert" className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">
              {authError}
            </div>
          )}

          {/* ---- Full Name Field ---- */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-1.5">
              Full Name
            </label>
            <input
              id="name"
              type="text"
              autoComplete="name"
              placeholder="Your full name"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (errors.name) setErrors((prev) => ({ ...prev, name: undefined }));
                setAuthError(null);
              }}
              aria-invalid={!!errors.name}
              aria-describedby={errors.name ? "name-error" : undefined}
              className={`
                w-full rounded-xl border px-4 py-3 text-slate-800 text-base
                placeholder:text-slate-400
                focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400
                transition-colors duration-150
                ${errors.name ? "border-red-400 bg-red-50" : "border-slate-300 bg-white"}
              `}
            />
            {errors.name && (
              <p id="name-error" role="alert" className="mt-1.5 text-sm text-red-500">{errors.name}</p>
            )}
          </div>

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
              autoComplete="new-password"
              placeholder="Create a password"
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
            <PrimaryActionButton label="Create Account" type="submit" isLoading={isSubmitting} />
          </div>

          {/* ---- Helper Text ---- */}
          <p className="text-center text-xs text-slate-500 pt-1 leading-relaxed">
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-medium text-emerald-600 hover:text-emerald-500 hover:underline"
            >
              Log in
            </Link>
          </p>
        </form>
      </CustomSectionCard>
    </div>
  );
}
"use client";

import { useState, useCallback, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import GroceryMascot from "@/components/ui/GroceryMascot";
import HeroBackground from "@/components/ui/HeroBackground";
import CustomSectionCard from "@/components/ui/CustomSectionCard";
import PrimaryActionButton from "@/components/ui/PrimaryActionButton";
import { validateSignupForm } from "@/lib/validation";
import type { SignupFormErrors } from "@/types/auth";

const BASE_URL = "https://aisleally.vercel.app";

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
    <div className="min-h-screen bg-cream">
      {/* ===== HERO ZONE ===== */}
      <div className="relative w-full overflow-hidden">
        {/* Animated gradient background */}
        <div className="absolute inset-0 z-0">
          <HeroBackground className="!w-full !h-full" />
        </div>

        {/* Content above gradient */}
        <div className="relative z-10 flex flex-col items-center justify-center pt-16 pb-24 px-6">
          <GroceryMascot className="!w-20 !h-auto mb-4" />
          <h1 className="text-2xl font-extrabold text-white tracking-tight">
            AisleAlly
          </h1>
        </div>
      </div>

      {/* ===== WHITE CARD ===== */}
      <div className="relative -mt-12 z-20">
        <div className="max-w-md mx-auto px-4">
          <CustomSectionCard className="!rounded-t-3xl !shadow-lg">
            {/* Headings */}
            <h2 className="text-xl font-bold text-primary text-center mb-1">
              Create your account
            </h2>
            <p className="text-sm text-gray-400 text-center mb-6">
              Sign up for AisleAlly
            </p>

            <form onSubmit={handleSubmit} noValidate className="space-y-5">

              {/* ---- Global error ---- */}
              {authError && (
                <div role="alert" className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">
                  {authError}
                </div>
              )}

              {/* ---- Full Name Field ---- */}
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-primary mb-1.5">
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
                  className={`w-full rounded-xl border px-4 py-3 text-sm text-primary placeholder:text-gray-400 bg-white focus:outline-none focus:ring-2 focus:ring-[#1B4332] focus:border-[#1B4332] transition-colors ${errors.name ? "border-red-400 bg-red-50" : "border-gray-200"}`}
                />
                {errors.name && (
                  <p id="name-error" role="alert" className="mt-1.5 text-xs text-red-500">{errors.name}</p>
                )}
              </div>

              {/* ---- Email Field ---- */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-primary mb-1.5">
                  Email
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
                  className={`w-full rounded-xl border px-4 py-3 text-sm text-primary placeholder:text-gray-400 bg-white focus:outline-none focus:ring-2 focus:ring-[#1B4332] focus:border-[#1B4332] transition-colors ${errors.email ? "border-red-400 bg-red-50" : "border-gray-200"}`}
                />
                {errors.email && (
                  <p id="email-error" role="alert" className="mt-1.5 text-xs text-red-500">{errors.email}</p>
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
                  className={`w-full rounded-xl border px-4 py-3 text-sm text-primary placeholder:text-gray-400 bg-white focus:outline-none focus:ring-2 focus:ring-[#1B4332] focus:border-[#1B4332] transition-colors ${errors.password ? "border-red-400 bg-red-50" : "border-gray-200"}`}
                />
                {errors.password && (
                  <p id="password-error" role="alert" className="mt-1.5 text-xs text-red-500">{errors.password}</p>
                )}
              </div>

              {/* ---- Submit ---- */}
              <PrimaryActionButton label="Create Account" type="submit" isLoading={isSubmitting} />

              {/* ---- Helper Text ---- */}
              <p className="text-center text-xs text-gray-400 pt-1">
                Already have an account?{" "}
                <Link
                  href="/login"
                  className="font-medium text-slate-600 underline underline-offset-2 hover:text-slate-900"
                >
                  Log in
                </Link>
              </p>
            </form>
          </CustomSectionCard>
        </div>
      </div>
    </div>
  );
}

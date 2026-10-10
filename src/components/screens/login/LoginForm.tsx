"use client";

import { useState, useCallback, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import CustomSectionCard from "@/components/ui/CustomSectionCard";
import PrimaryActionButton from "@/components/ui/PrimaryActionButton";
import { validateLoginForm } from "@/lib/validation";
import type { LoginFormErrors, AuthProps } from "@/types/auth";

/**
 * Login form composed from AisleAlly UI primitives.
 *
 * Handles:
 * - Email and password field state
 * - Client-side validation on submit
 * - Inline error messages
 * - Navigation to /health-focus on success
 * - Auth state callback for prop drilling
 */
export default function LoginForm({ onAuth }: AuthProps) {
  const router = useRouter();

  // --- Form field state ---
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<LoginFormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- Submit handler ---
  const handleSubmit = useCallback(
    async (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();

      // Validate
      const formErrors = validateLoginForm(email, password);
      if (Object.keys(formErrors).length > 0) {
        setErrors(formErrors);
        return;
      }

      // Clear any previous errors
      setErrors({});
      setIsSubmitting(true);

      // Simulate a brief network delay for realistic UX
      await new Promise((resolve) => setTimeout(resolve, 800));

      // Persist user identity to localStorage so getUserId() works
      localStorage.setItem("aisleally-user-id", email);

      // Lift auth state up if callback provided
      onAuth?.(email);

      // Navigate to Screen 2
      router.push("/health-focus");
    },
    [email, password, onAuth, router]
  );

  return (
    <CustomSectionCard title="Sign in to AisleAlly">
      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        {/* ---- Email Field ---- */}
        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-slate-700 mb-1.5"
          >
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
            <p id="email-error" role="alert" className="mt-1.5 text-sm text-red-500">
              {errors.email}
            </p>
          )}
        </div>

        {/* ---- Password Field ---- */}
        <div>
          <label
            htmlFor="password"
            className="block text-sm font-medium text-slate-700 mb-1.5"
          >
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
              if (errors.password)
                setErrors((prev) => ({ ...prev, password: undefined }));
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
            <p id="password-error" role="alert" className="mt-1.5 text-sm text-red-500">
              {errors.password}
            </p>
          )}
        </div>

        {/* ---- Submit Button ---- */}
        <div className="pt-2">
          <PrimaryActionButton
            label="Sign In"
            type="submit"
            isLoading={isSubmitting}
          />
        </div>

        {/* ---- Helper Text ---- */}
        <p className="text-center text-sm text-slate-500 pt-1">
          Don&apos;t have an account?{" "}
          <span className="text-emerald-600 font-medium cursor-pointer hover:underline">
            Sign up
          </span>
        </p>
      </form>
    </CustomSectionCard>
  );
}

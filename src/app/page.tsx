"use client";

import { useState, useCallback, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import GroceryMascot from "@/components/ui/GroceryMascot";
import HeroBackground from "@/components/ui/HeroBackground";
import CustomSectionCard from "@/components/ui/CustomSectionCard";
import { FlowButton } from "@/components/ui/FlowButton";

/**
 * Route: / (Login Screen)
 *
 * The first screen of the app. Shows the AisleAlly branding with an
 * animated gradient hero, then a white card with a simple email/password
 * sign-in form. No real authentication — any non-empty values pass.
 */
export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{ email?: string; password?: string }>(
    {},
  );

  const handleSubmit = useCallback(
    (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();

      const newErrors: { email?: string; password?: string } = {};
      if (!email.trim()) newErrors.email = "Please enter your email";
      if (!password.trim()) newErrors.password = "Please enter your password";

      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        return;
      }

      // No real auth for MVP — store email as user ID and navigate to onboarding
      localStorage.setItem("aisleally-user-id", email.trim().toLowerCase());
      router.push("/onboarding");
    },
    [email, password, router],
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
              Welcome back
            </h2>
            <p className="text-sm text-gray-400 text-center mb-6">
              Sign in to your AisleAlly account
            </p>

            {/* Form */}
            <form onSubmit={handleSubmit} noValidate className="space-y-5">
              {/* Email field */}
              <div>
                <label
                  htmlFor="login-email"
                  className="block text-sm font-medium text-primary mb-1.5"
                >
                  Email
                </label>
                <input
                  id="login-email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (errors.email)
                      setErrors((prev) => ({ ...prev, email: undefined }));
                  }}
                  className={`w-full rounded-xl border px-4 py-3 text-sm text-primary placeholder:text-gray-400 bg-white focus:outline-none focus:ring-2 focus:ring-[#1B4332] focus:border-[#1B4332] transition-colors ${
                    errors.email
                      ? "border-red-400 bg-red-50"
                      : "border-gray-200"
                  }`}
                />
                {errors.email && (
                  <p role="alert" className="mt-1.5 text-xs text-red-500">
                    {errors.email}
                  </p>
                )}
              </div>

              {/* Password field */}
              <div>
                <label
                  htmlFor="login-password"
                  className="block text-sm font-medium text-primary mb-1.5"
                >
                  Password
                </label>
                <input
                  id="login-password"
                  type="password"
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errors.password)
                      setErrors((prev) => ({ ...prev, password: undefined }));
                  }}
                  className={`w-full rounded-xl border px-4 py-3 text-sm text-primary placeholder:text-gray-400 bg-white focus:outline-none focus:ring-2 focus:ring-[#1B4332] focus:border-[#1B4332] transition-colors ${
                    errors.password
                      ? "border-red-400 bg-red-50"
                      : "border-gray-200"
                  }`}
                />
                {errors.password && (
                  <p role="alert" className="mt-1.5 text-xs text-red-500">
                    {errors.password}
                  </p>
                )}
              </div>

              {/* Sign In button */}
              <FlowButton text="Sign In" type="submit" />

              {/* Helper text */}
              <p className="text-center text-xs text-gray-400 pt-1">
                New here? Your profile will be set up after sign in.
              </p>
            </form>
          </CustomSectionCard>
        </div>
      </div>
    </div>
  );
}
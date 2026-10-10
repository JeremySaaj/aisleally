"use client";

import LoginForm from "@/components/screens/login/LoginForm";

/**
 * Route: /login
 *
 * Sign-in screen for existing accounts. Renders the shared LoginForm,
 * which links to /signup for new users.
 */
export default function LoginRoute() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <LoginForm />
    </div>
  );
}
"use client";

import LoginForm from "@/components/screens/login/LoginForm";

/**
 * Route: /login
 *
 * Sign-in screen for existing accounts. Renders the shared LoginForm —
 * branded hero (green gradient + grocery mascot) with the sign-in card,
 * linking to /signup for new users.
 */
export default function LoginRoute() {
  return <LoginForm />;
}
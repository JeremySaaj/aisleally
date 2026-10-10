import { redirect } from "next/navigation";

/**
 * Health Focus setup lives in the onboarding flow ("/onboarding").
 * This route redirects for backwards compatibility.
 */
export default function HealthFocusPage() {
  redirect("/onboarding");
}

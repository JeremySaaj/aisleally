import { redirect } from "next/navigation";

/**
 * Health Focus route now lives at the root ("/").
 * This route redirects for backwards compatibility.
 */
export default function HealthFocusPage() {
  redirect("/");
}

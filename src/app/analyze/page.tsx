import { redirect } from "next/navigation";

/**
 * Legacy /analyze route — now replaced by /analyze/[id].
 * Redirects to /home for backwards compatibility.
 */
export default function AnalyzeRoute() {
  redirect("/home");
}

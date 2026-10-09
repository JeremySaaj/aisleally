import { notFound } from "next/navigation";
import { getProductAnalysis } from "@/lib/mockAnalysis";
import ProductAnalysisScreen from "@/components/screens/analysis/ProductAnalysisScreen";

/**
 * Route: /analyze/[id]
 *
 * Dynamic route that looks up a product analysis by id and renders it.
 * If no matching id is found, returns a 404.
 *
 * This is a Server Component — it reads the id from params, looks up
 * mock data, and passes it down to the client-side ProductAnalysisScreen.
 */
export default async function AnalyzeProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const analysis = getProductAnalysis(id);

  if (!analysis) {
    notFound();
  }

  return <ProductAnalysisScreen analysis={analysis} />;
}

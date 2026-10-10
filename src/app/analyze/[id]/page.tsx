import ProductAnalysisClient from "@/components/screens/analysis/ProductAnalysisClient";

/**
 * Route: /analyze/[id]
 *
 * Renders a client component that reads the product from sessionStorage
 * (set when the user clicked a search result on the home page) and calls
 * the FastAPI backend to analyze its ingredients against the user's profile.
 */
export default async function AnalyzeProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ProductAnalysisClient productId={id} />;
}

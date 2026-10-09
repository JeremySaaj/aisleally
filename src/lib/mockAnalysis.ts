import type { ProductAnalysis } from "@/types/auth";

/**
 * Mock product analyses for all 3 products on Screen 2.
 *
 * In production each analysis would come from an API. For the MVP we use
 * static data so the UI can be fully tested without a backend.
 */

const ALMOND_MILK_ANALYSIS: ProductAnalysis = {
  product: {
    id: "sanitarium-almond-milk",
    name: "Sanitarium Almond Milk",
    category: "Dairy-free · Beverages",
    status: "trigger",
  },
  verdict: {
    status: "trigger",
    title: "Trigger Found",
    subtext: "This product contains ingredients that conflict with your profile.",
  },
  conditionFlags: [
    {
      status: "trigger",
      description: "Carrageenan (407) is a thickener linked to gut inflammation in IBS sufferers",
    },
    {
      status: "caution",
      description: "Sunflower lecithin may aggravate skin sensitivity in some eczema sufferers",
    },
  ],
  ingredients: [
    { name: "Filtered Water", status: "safe", showExplanationHint: true, aiExplanation: "Water is the base of this product and is completely safe for all health conditions including IBS and eczema." },
    { name: "Almonds (2.5%)", status: "safe", showExplanationHint: true, aiExplanation: "Almonds are a natural, minimally processed nut. At 2.5% concentration they are generally well tolerated by IBS and eczema sufferers." },
    { name: "Carrageenan (407)", status: "trigger", showExplanationHint: true, aiExplanation: "Carrageenan is a seaweed-derived thickener linked to gut inflammation. For IBS sufferers like you, it can trigger bloating and digestive discomfort." },
    { name: "Sunflower Lecithin", status: "caution", showExplanationHint: true, aiExplanation: "Sunflower lecithin is an emulsifier that may aggravate skin barrier function in eczema-prone individuals, potentially worsening flare-ups." },
  ],
};

const GLUTEN_FREE_BREAD_ANALYSIS: ProductAnalysis = {
  product: {
    id: "helgas-gluten-free-bread",
    name: "Helga's Gluten Free Bread",
    category: "Gluten-free · Bakery",
    status: "caution",
  },
  verdict: {
    status: "caution",
    title: "Caution — Check Ingredients",
    subtext: "This product has minor concerns flagged against your profile.",
  },
  conditionFlags: [
    {
      status: "caution",
      description: "Soy Flour may trigger IBS in sensitive individuals",
    },
    {
      status: "trigger",
      description: "Preservative 282 is linked to gut irritation and headaches",
    },
  ],
  ingredients: [
    { name: "Wholemeal Wheat Flour", status: "safe", showExplanationHint: true, aiExplanation: "Wholemeal wheat flour contains gluten. However this product is certified gluten-free, meaning the gluten has been processed to safe levels for most people." },
    { name: "Yeast", status: "safe", showExplanationHint: true, aiExplanation: "Yeast is a natural leavening agent and is generally safe for IBS and eczema sufferers in normal bread quantities." },
    { name: "Soy Flour", status: "caution", showExplanationHint: true, aiExplanation: "Soy flour can ferment in the gut and trigger IBS symptoms including bloating and cramping in sensitive individuals." },
    { name: "Preservative 282", status: "trigger", showExplanationHint: true, aiExplanation: "Preservative 282 (calcium propionate) has been linked to gut irritation and headaches in people with digestive sensitivities." },
  ],
};

const CHEESE_SLICES_ANALYSIS: ProductAnalysis = {
  product: {
    id: "bega-natural-cheese-slices",
    name: "Bega Natural Cheese Slices",
    category: "Contains Dairy · Dairy",
    status: "trigger",
  },
  verdict: {
    status: "trigger",
    title: "Trigger Found",
    subtext: "This product contains ingredients that conflict with your profile.",
  },
  conditionFlags: [
    {
      status: "trigger",
      description: "Milk Solids contains dairy, conflicts with Non-Dairy profile",
    },
    {
      status: "caution",
      description: "Emulsifier 331 may cause gut discomfort in IBS sufferers",
    },
  ],
  ingredients: [
    { name: "Cheese", status: "safe", showExplanationHint: true, aiExplanation: "Natural cheese in small amounts is generally tolerable, but as a dairy product it may still cause mild symptoms for those with dairy sensitivity." },
    { name: "Milk Solids", status: "trigger", showExplanationHint: true, aiExplanation: "Milk solids contain high levels of dairy protein and lactose, directly conflicting with your Non-Dairy profile and potentially triggering digestive symptoms." },
    { name: "Emulsifier 331", status: "caution", showExplanationHint: true, aiExplanation: "Emulsifier 331 (sodium citrate) may cause gut discomfort and loose stools in IBS sufferers when consumed in large quantities." },
  ],
};

/**
 * Lookup table keyed by product id.
 */
const ANALYSIS_MAP: Record<string, ProductAnalysis> = {
  "sanitarium-almond-milk": ALMOND_MILK_ANALYSIS,
  "helgas-gluten-free-bread": GLUTEN_FREE_BREAD_ANALYSIS,
  "bega-natural-cheese-slices": CHEESE_SLICES_ANALYSIS,
};

/**
 * Look up a product analysis by its id.
 *
 * Returns the matching `ProductAnalysis` or `undefined` if not found.
 * Structured as a standalone function so it can later be replaced with
 * an API call without changing the page component.
 */
export function getProductAnalysis(id: string): ProductAnalysis | undefined {
  return ANALYSIS_MAP[id];
}

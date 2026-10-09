import type { ProductComparison, ThreeWayComparison } from "@/types/auth";

/**
 * Mock comparison data for all product matchups.
 *
 * Used on Screen 4 (Head-to-Head Comparison). In production this would
 * come from an AI analysis API. For the MVP we use static data.
 */

// ── Sanitarium Almond Milk vs Australia's Own Almond Milk ──────────────
const SANITARIUM_COMPARISON: ProductComparison = {
  productA: {
    name: "Sanitarium Almond Milk",
    subtitle: "Original · 1L",
    status: "trigger",
    verdictLabel: "Trigger Found",
  },
  productB: {
    name: "Australia's Own Almond Milk",
    subtitle: "Original · 1L",
    status: "safe",
    verdictLabel: "Safe",
    isAiPick: true,
  },
  verdict: {
    text: "Australia's Own avoids Carrageenan and Sunflower Lecithin, both flagged triggers for your IBS and Eczema profile.",
    tradeoff:
      "Australia's Own has slightly less protein per serve (0.8g vs 1.1g) but eliminates both your primary triggers.",
  },
  comparisonRows: [
    {
      name: "Carrageenan",
      statusA: "trigger",
      statusB: "safe",
    },
    {
      name: "Sunflower Lecithin",
      statusA: "caution",
      statusB: "safe",
    },
    {
      name: "Organic Almonds",
      statusA: "safe",
      statusB: "safe",
    },
  ],
};

// ── Helga's Gluten Free Bread vs Baker's Delight Wholemeal ─────────────
const HELGAS_BREAD_COMPARISON: ProductComparison = {
  productA: {
    name: "Helga's Gluten Free Bread",
    subtitle: "Gluten-free · 650g",
    status: "caution",
    verdictLabel: "Caution",
  },
  productB: {
    name: "Baker's Delight Wholemeal",
    subtitle: "Wholemeal · 680g",
    status: "safe",
    verdictLabel: "Safe",
    isAiPick: true,
  },
  verdict: {
    text: "Baker's Delight Wholemeal avoids Soy Flour and Preservative 282, both flagged as concerns for your IBS profile.",
    tradeoff:
      "Baker's Delight contains gluten (wheat), so while it is free of your chemical triggers, it is not suitable for coeliac disease.",
  },
  comparisonRows: [
    {
      name: "Soy Flour",
      statusA: "caution",
      statusB: "safe",
    },
    {
      name: "Preservative 282",
      statusA: "trigger",
      statusB: "safe",
    },
    {
      name: "Wholemeal Wheat Flour",
      statusA: "safe",
      statusB: "safe",
    },
    {
      name: "Yeast",
      statusA: "safe",
      statusB: "safe",
    },
  ],
};

// ── Bega Natural Cheese Slices vs Bob's Farm Cheddar ───────────────────
const CHEESE_COMPARISON: ProductComparison = {
  productA: {
    name: "Bega Natural Cheese Slices",
    subtitle: "Cheese Slices · 250g",
    status: "trigger",
    verdictLabel: "Trigger Found",
  },
  productB: {
    name: "Bob's Farm Cheddar",
    subtitle: "Organic Cheddar · 200g",
    status: "caution",
    verdictLabel: "Caution",
    isAiPick: false,
  },
  verdict: {
    text: "Bob's Farm Cheddar is organic with fewer additives, but still contains dairy — a trigger for your Non-Dairy profile.",
    tradeoff:
      "Bob's Farm removes Emulsifier 331, reducing gut irritation risk, but dairy proteins remain a concern for your sensitivities.",
  },
  comparisonRows: [
    {
      name: "Milk Solids",
      statusA: "trigger",
      statusB: "caution",
    },
    {
      name: "Emulsifier 331",
      statusA: "caution",
      statusB: "safe",
    },
    {
      name: "Cheese Cultures",
      statusA: "safe",
      statusB: "safe",
    },
  ],
};

// ── Backward-compatible default export ─────────────────────────────────
/** @deprecated Use `getComparison()` instead for dynamic lookups */
export const MOCK_COMPARISON: ProductComparison = SANITARIUM_COMPARISON;

// ── Lookup map keyed by productA id ────────────────────────────────────
const COMPARISON_MAP: Record<string, ProductComparison> = {
  "sanitarium-almond-milk": SANITARIUM_COMPARISON,
  "helgas-gluten-free-bread": HELGAS_BREAD_COMPARISON,
  "bega-natural-cheese-slices": CHEESE_COMPARISON,
};

/**
 * Look up a comparison by the primary product id (productA).
 *
 * When `productBId` is provided it is currently used as a future-proofing
 * parameter — the MVP only has one competitor per product, but the
 * signature is ready for a real API that supports multiple matchups.
 *
 * Returns the matching `ProductComparison` or `undefined` if not found.
 * Structured as a standalone function so it can later be replaced with
 * an API call without changing the screen component.
 */
export function getComparison(
  productAId: string,
  _productBId?: string,
): ProductComparison | undefined {
  return COMPARISON_MAP[productAId];
}

// ═══════════════════════════════════════════════════════════════════════
// Three-Way Comparison Data
// ═══════════════════════════════════════════════════════════════════════

const THREE_WAY_SANITARIUM_HELGAS: ThreeWayComparison = {
  productA: {
    name: "Sanitarium Almond Milk",
    subtitle: "Original · 1L",
    status: "trigger",
    verdictLabel: "Trigger Found",
  },
  productB: {
    name: "Helga's Gluten Free Bread",
    subtitle: "Gluten-free · 650g",
    status: "caution",
    verdictLabel: "Caution",
  },
  aiPick: {
    name: "Australia's Own Almond Milk",
    subtitle: "Original · 1L",
    status: "safe",
    verdictLabel: "Safe",
    isAiPick: true,
  },
  verdict: {
    text: "Australia's Own avoids Carrageenan and Sunflower Lecithin, both flagged triggers for your IBS and Eczema profile.",
    tradeoff:
      "Australia's Own has slightly less protein per serve (0.8g vs 1.1g) but eliminates both your primary triggers.",
    threeWayText:
      "While Helga's is free of your almond-milk triggers, it introduces Soy Flour and Preservative 282 — both concerns for your IBS. Australia's Own eliminates all flagged triggers, making it the safest choice for your profile.",
  },
  comparisonRows: [
    { name: "Carrageenan", statusA: "trigger", statusB: "safe", statusC: "safe" },
    { name: "Sunflower Lecithin", statusA: "caution", statusB: "safe", statusC: "safe" },
    { name: "Soy Flour", statusA: "safe", statusB: "caution", statusC: "safe" },
    { name: "Preservative 282", statusA: "safe", statusB: "trigger", statusC: "safe" },
    { name: "Organic Almonds", statusA: "safe", statusB: "safe", statusC: "safe" },
  ],
};

const THREE_WAY_SANITARIUM_BEGA: ThreeWayComparison = {
  productA: {
    name: "Sanitarium Almond Milk",
    subtitle: "Original · 1L",
    status: "trigger",
    verdictLabel: "Trigger Found",
  },
  productB: {
    name: "Bega Natural Cheese Slices",
    subtitle: "Cheese Slices · 250g",
    status: "trigger",
    verdictLabel: "Trigger Found",
  },
  aiPick: {
    name: "Australia's Own Almond Milk",
    subtitle: "Original · 1L",
    status: "safe",
    verdictLabel: "Safe",
    isAiPick: true,
  },
  verdict: {
    text: "Both Sanitarium and Bega contain triggers for your profile. Australia's Own eliminates all flagged ingredients.",
    tradeoff:
      "Switching to Australia's Own removes Carrageenan and Sunflower Lecithin. Bega introduces dairy triggers that Sanitarium does not have.",
    threeWayText:
      "While Bega avoids Carrageenan, it introduces Milk Solids and Emulsifier 331 — both triggers for your Non-Dairy and IBS profiles. Australia's Own eliminates all flagged triggers, making it the safest choice for your profile.",
  },
  comparisonRows: [
    { name: "Carrageenan", statusA: "trigger", statusB: "safe", statusC: "safe" },
    { name: "Sunflower Lecithin", statusA: "caution", statusB: "safe", statusC: "safe" },
    { name: "Milk Solids", statusA: "safe", statusB: "trigger", statusC: "safe" },
    { name: "Emulsifier 331", statusA: "safe", statusB: "caution", statusC: "safe" },
  ],
};

const THREE_WAY_HELGAS_SANITARIUM: ThreeWayComparison = {
  productA: {
    name: "Helga's Gluten Free Bread",
    subtitle: "Gluten-free · 650g",
    status: "caution",
    verdictLabel: "Caution",
  },
  productB: {
    name: "Sanitarium Almond Milk",
    subtitle: "Original · 1L",
    status: "trigger",
    verdictLabel: "Trigger Found",
  },
  aiPick: {
    name: "Baker's Delight Wholemeal",
    subtitle: "Wholemeal · 680g",
    status: "safe",
    verdictLabel: "Safe",
    isAiPick: true,
  },
  verdict: {
    text: "Baker's Delight Wholemeal avoids Soy Flour and Preservative 282, both flagged as concerns for your IBS profile.",
    tradeoff:
      "Baker's Delight contains gluten (wheat), so while it is free of your chemical triggers, it is not suitable for coeliac disease.",
    threeWayText:
      "While Sanitarium is free of bread-related triggers, it introduces Carrageenan — a gut inflammation trigger for IBS. Baker's Delight eliminates all your flagged ingredients, making it the safest choice for your profile.",
  },
  comparisonRows: [
    { name: "Soy Flour", statusA: "caution", statusB: "safe", statusC: "safe" },
    { name: "Preservative 282", statusA: "trigger", statusB: "safe", statusC: "safe" },
    { name: "Carrageenan", statusA: "safe", statusB: "trigger", statusC: "safe" },
    { name: "Wholemeal Wheat Flour", statusA: "safe", statusB: "safe", statusC: "safe" },
  ],
};

const THREE_WAY_HELGAS_BEGA: ThreeWayComparison = {
  productA: {
    name: "Helga's Gluten Free Bread",
    subtitle: "Gluten-free · 650g",
    status: "caution",
    verdictLabel: "Caution",
  },
  productB: {
    name: "Bega Natural Cheese Slices",
    subtitle: "Cheese Slices · 250g",
    status: "trigger",
    verdictLabel: "Trigger Found",
  },
  aiPick: {
    name: "Baker's Delight Wholemeal",
    subtitle: "Wholemeal · 680g",
    status: "safe",
    verdictLabel: "Safe",
    isAiPick: true,
  },
  verdict: {
    text: "Baker's Delight Wholemeal avoids Soy Flour and Preservative 282, both flagged as concerns for your IBS profile.",
    tradeoff:
      "Baker's Delight contains gluten (wheat), so while it is free of your chemical triggers, it is not suitable for coeliac disease.",
    threeWayText:
      "While Bega avoids Soy Flour, it introduces Milk Solids and Emulsifier 331 — triggers for your Non-Dairy and IBS profiles. Baker's Delight eliminates all flagged ingredients, making it the safest choice for your profile.",
  },
  comparisonRows: [
    { name: "Soy Flour", statusA: "caution", statusB: "safe", statusC: "safe" },
    { name: "Preservative 282", statusA: "trigger", statusB: "safe", statusC: "safe" },
    { name: "Milk Solids", statusA: "safe", statusB: "trigger", statusC: "safe" },
    { name: "Emulsifier 331", statusA: "safe", statusB: "caution", statusC: "safe" },
  ],
};

const THREE_WAY_BEGA_SANITARIUM: ThreeWayComparison = {
  productA: {
    name: "Bega Natural Cheese Slices",
    subtitle: "Cheese Slices · 250g",
    status: "trigger",
    verdictLabel: "Trigger Found",
  },
  productB: {
    name: "Sanitarium Almond Milk",
    subtitle: "Original · 1L",
    status: "trigger",
    verdictLabel: "Trigger Found",
  },
  aiPick: {
    name: "Bob's Farm Cheddar",
    subtitle: "Organic Cheddar · 200g",
    status: "caution",
    verdictLabel: "Caution",
    isAiPick: true,
  },
  verdict: {
    text: "Bob's Farm Cheddar is organic with fewer additives, but still contains dairy — a trigger for your Non-Dairy profile.",
    tradeoff:
      "Bob's Farm removes Emulsifier 331, reducing gut irritation risk, but dairy proteins remain a concern.",
    threeWayText:
      "While Sanitarium avoids dairy, it introduces Carrageenan — a gut inflammation trigger for IBS. Bob's Farm removes Emulsifier 331 and uses organic ingredients, making it the least problematic choice despite the remaining dairy concern.",
  },
  comparisonRows: [
    { name: "Milk Solids", statusA: "trigger", statusB: "safe", statusC: "caution" },
    { name: "Emulsifier 331", statusA: "caution", statusB: "safe", statusC: "safe" },
    { name: "Carrageenan", statusA: "safe", statusB: "trigger", statusC: "safe" },
    { name: "Cheese Cultures", statusA: "safe", statusB: "safe", statusC: "safe" },
  ],
};

const THREE_WAY_BEGA_HELGAS: ThreeWayComparison = {
  productA: {
    name: "Bega Natural Cheese Slices",
    subtitle: "Cheese Slices · 250g",
    status: "trigger",
    verdictLabel: "Trigger Found",
  },
  productB: {
    name: "Helga's Gluten Free Bread",
    subtitle: "Gluten-free · 650g",
    status: "caution",
    verdictLabel: "Caution",
  },
  aiPick: {
    name: "Bob's Farm Cheddar",
    subtitle: "Organic Cheddar · 200g",
    status: "caution",
    verdictLabel: "Caution",
    isAiPick: true,
  },
  verdict: {
    text: "Bob's Farm Cheddar is organic with fewer additives, but still contains dairy — a trigger for your Non-Dairy profile.",
    tradeoff:
      "Bob's Farm removes Emulsifier 331, reducing gut irritation risk, but dairy proteins remain a concern.",
    threeWayText:
      "While Helga's avoids dairy entirely, it introduces Soy Flour and Preservative 282 — both IBS triggers. Bob's Farm removes Emulsifier 331 and uses organic ingredients, making it the least problematic choice despite the remaining dairy concern.",
  },
  comparisonRows: [
    { name: "Milk Solids", statusA: "trigger", statusB: "safe", statusC: "caution" },
    { name: "Emulsifier 331", statusA: "caution", statusB: "safe", statusC: "safe" },
    { name: "Soy Flour", statusA: "safe", statusB: "caution", statusC: "safe" },
    { name: "Preservative 282", statusA: "safe", statusB: "trigger", statusC: "safe" },
  ],
};

// ── Three-way lookup map keyed by `${productAId}::${productBId}` ──────
const THREE_WAY_MAP: Record<string, ThreeWayComparison> = {
  "sanitarium-almond-milk::helgas-gluten-free-bread": THREE_WAY_SANITARIUM_HELGAS,
  "sanitarium-almond-milk::bega-natural-cheese-slices": THREE_WAY_SANITARIUM_BEGA,
  "helgas-gluten-free-bread::sanitarium-almond-milk": THREE_WAY_HELGAS_SANITARIUM,
  "helgas-gluten-free-bread::bega-natural-cheese-slices": THREE_WAY_HELGAS_BEGA,
  "bega-natural-cheese-slices::sanitarium-almond-milk": THREE_WAY_BEGA_SANITARIUM,
  "bega-natural-cheese-slices::helgas-gluten-free-bread": THREE_WAY_BEGA_HELGAS,
};

/**
 * Look up a three-way comparison by productA and productB ids.
 *
 * The AI Pick is automatically determined based on productA — it is the
 * same competitor that appears in the two-way `getComparison()` result.
 *
 * Returns the matching `ThreeWayComparison` or `undefined` if not found.
 */
export function getThreeWayComparison(
  productAId: string,
  productBId: string,
): ThreeWayComparison | undefined {
  return THREE_WAY_MAP[`${productAId}::${productBId}`];
}

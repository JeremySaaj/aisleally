/**
 * Authentication-related TypeScript types for AisleAlly.
 * Designed for prop drilling with future Context migration in mind.
 */

/** Shape of the authentication state held by the parent/page component */
export interface AuthState {
  email: string;
  isAuthenticated: boolean;
}

/** Props that authentication-aware components can receive */
export interface AuthProps {
  /** Callback fired on successful login — passes the email up to the parent */
  onAuth?: (email: string) => void;
  /** Current auth state passed down from parent (optional for MVP) */
  authState?: AuthState;
}

/** Form field values for the login form */
export interface LoginFormData {
  email: string;
  password: string;
}

/** Validation errors keyed by field name */
export interface LoginFormErrors {
  email?: string;
  password?: string;
}

/**
 * Health status types used by HealthStatusBadge and grocery item lists.
 * "safe"    → green  (#22C55E) — item is compatible with user's health profile
 * "caution" → orange (#F97316) — minor concern (e.g., trace allergens)
 * "trigger" → red    (#EF4444) — item may trigger a sensitivity/allergy
 * "unknown" → grey              — not yet analysed
 */
export type HealthStatus = "safe" | "caution" | "trigger" | "unknown";

/**
 * Shape of the saved health profile from Screen 1 (stored in localStorage
 * under key "aisleally-profile").
 */
export interface HealthProfile {
  healthFocusAreas: string[];
  hardExclusions: string[];
  customTags: string[];
  savedAt?: string;
}

/**
 * A grocery product used in recent searches and product cards.
 */
export interface Product {
  id: string;
  name: string;
  /** e.g. "Dairy-free · Beverages" */
  category: string;
  status: HealthStatus;
  /** Product image URL from Open Food Facts */
  image_url?: string;
}

/**
 * A flag raised for a specific health condition when analysing a product.
 * e.g. "Carrageenan (407) is a thickener linked to gut inflammation in IBS sufferers"
 */
export interface ConditionFlag {
  status: "trigger" | "caution";
  description: string;
}

/**
 * A single ingredient in a product's breakdown list.
 */
export interface Ingredient {
  name: string;
  status: HealthStatus;
  /** If true, shows a "Tap for AI Explanation" hint below the ingredient name */
  showExplanationHint: boolean;
  /** AI-generated explanation for why this ingredient has its status (shown when expanded) */
  aiExplanation: string;
}

/**
 * Full analysis data for a single product (used on Screen 3).
 */
export interface ProductAnalysis {
  product: Product;
  verdict: {
    status: HealthStatus;
    /** e.g. "Trigger Found" */
    title: string;
    /** e.g. "This product contains ingredients that conflict with your profile." */
    subtext: string;
  };
  conditionFlags: ConditionFlag[];
  ingredients: Ingredient[];
}

/**
 * A single row in the side-by-side comparison table (Screen 4).
 */
export interface ComparisonRow {
  name: string;
  /** Product A's status for this ingredient */
  statusA: HealthStatus;
  /** Product B's status for this ingredient */
  statusB: HealthStatus;
  /** AI Pick's status for this ingredient (only present in 3-way comparisons) */
  statusC?: HealthStatus;
}

/**
 * Full comparison data for two products (used on Screen 4).
 */
export interface ProductComparison {
  productA: {
    name: string;
    subtitle: string;
    /** Overall verdict status */
    status: HealthStatus;
    /** e.g. "Trigger Found" */
    verdictLabel: string;
  };
  productB: {
    name: string;
    subtitle: string;
    /** Overall verdict status */
    status: HealthStatus;
    /** e.g. "Safe" */
    verdictLabel: string;
    /** If true, renders the "AI PICK" banner across the top of the card */
    isAiPick: boolean;
  };
  verdict: {
    /** Main verdict explanation */
    text: string;
    /** Trade-off explanation */
    tradeoff: string;
  };
  comparisonRows: ComparisonRow[];
}

/**
 * Summary card data for a single product in a three-way comparison.
 */
export interface ThreeWayProduct {
  name: string;
  subtitle: string;
  status: HealthStatus;
  verdictLabel: string;
}

/**
 * Full comparison data for three products (used on Screen 4 in 3-way mode).
 *
 * Includes the two user-selected products plus an AI Pick, a combined
 * ingredient list with statuses for all three, and verdict text that
 * mentions all three products.
 */
export interface ThreeWayComparison {
  productA: ThreeWayProduct;
  productB: ThreeWayProduct;
  aiPick: ThreeWayProduct & { isAiPick: true };
  verdict: {
    /** Verdict text mentioning all 3 products */
    text: string;
    /** Trade-off explanation */
    tradeoff: string;
    /** Extra sentence explaining why the AI Pick is still recommended */
    threeWayText: string;
  };
  comparisonRows: ComparisonRow[];
}

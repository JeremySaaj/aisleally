import type { Product } from "@/types/auth";

/**
 * Hardcoded mock products for the Recent Searches section on Screen 2.
 *
 * In production these would come from an API. For the MVP we use static
 * data so the UI can be fully tested without a backend.
 */
export const MOCK_RECENT_SEARCHES: Product[] = [
  {
    id: "sanitarium-almond-milk",
    name: "Sanitarium Almond Milk",
    category: "Dairy-free · Beverages",
    status: "trigger",
  },
  {
    id: "helgas-gluten-free-bread",
    name: "Helga's Gluten Free Bread",
    category: "Gluten-free · Bakery",
    status: "caution",
  },
  {
    id: "bega-natural-cheese-slices",
    name: "Bega Natural Cheese Slices",
    category: "Contains Dairy · Dairy",
    status: "trigger",
  },
];

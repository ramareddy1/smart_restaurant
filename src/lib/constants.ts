export const INGREDIENT_CATEGORIES = [
  "Produce",
  "Dairy",
  "Meat",
  "Seafood",
  "Dry Goods",
  "Spices",
  "Oils & Vinegars",
  "Bakery",
  "Beverages",
  "Frozen",
  "Other",
] as const;

export const INGREDIENT_UNITS = [
  "kg",
  "g",
  "lb",
  "oz",
  "liters",
  "ml",
  "pieces",
  "dozen",
  "bunch",
  "can",
  "bottle",
  "bag",
  "box",
] as const;

export const RECIPE_CATEGORIES = [
  "Appetizer",
  "Main Course",
  "Side Dish",
  "Dessert",
  "Soup",
  "Salad",
  "Beverage",
  "Sauce",
  "Bread",
  "Other",
] as const;

export const MENU_ITEM_CATEGORIES = [
  "Starters",
  "Mains",
  "Sides",
  "Desserts",
  "Drinks",
  "Specials",
] as const;

export const TRANSACTION_TYPES = [
  { value: "PURCHASE", label: "Purchase" },
  { value: "USAGE", label: "Usage" },
  { value: "WASTE", label: "Waste" },
  { value: "ADJUSTMENT", label: "Adjustment" },
] as const;

// ─── Business Rule Constants ──────────────────────────────
export const STOCK_OVERSTOCK_MULTIPLIER = 3;
export const STOCK_CRITICAL_MULTIPLIER = 0.5;
export const EXPIRY_WARNING_DAYS = 3;
export const EXPIRY_WARNING_MS = EXPIRY_WARNING_DAYS * 24 * 60 * 60 * 1000;
export const TRANSACTION_LOOKBACK_DAYS = 30;
export const TRANSACTION_LOOKBACK_MS = TRANSACTION_LOOKBACK_DAYS * 24 * 60 * 60 * 1000;
export const WASTE_RATIO_THRESHOLD = 0.2;

// ─── Dashboard / UI Constants ─────────────────────────────
export const DASHBOARD_REFRESH_MS = 30_000;
export const MAX_AI_CONTEXT_LENGTH = 20_000;

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

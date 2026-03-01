import { z } from "zod";

// ─── Ingredient ──────────────────────────

export const createIngredientSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  category: z.string().min(1, "Category is required"),
  unit: z.string().min(1, "Unit is required"),
  currentStock: z.number().min(0, "Stock cannot be negative"),
  parLevel: z.number().min(0, "Par level must be positive"),
  costPerUnit: z.number().min(0, "Cost must be positive"),
  expirationDate: z.string().optional().nullable(),
  supplierId: z.string().optional().nullable(),
});

export const updateIngredientSchema = createIngredientSchema.partial();

export type CreateIngredientInput = z.infer<typeof createIngredientSchema>;

// ─── Supplier ────────────────────────────

export const createSupplierSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  contactEmail: z
    .string()
    .email("Invalid email")
    .optional()
    .nullable()
    .or(z.literal("")),
  contactPhone: z.string().optional().nullable().or(z.literal("")),
  address: z.string().optional().nullable().or(z.literal("")),
  notes: z.string().optional().nullable().or(z.literal("")),
});

export const updateSupplierSchema = createSupplierSchema.partial();

export type CreateSupplierInput = z.infer<typeof createSupplierSchema>;

// ─── Recipe ──────────────────────────────

export const recipeIngredientSchema = z.object({
  ingredientId: z.string().min(1, "Ingredient is required"),
  quantity: z.number().min(0.001, "Quantity must be positive"),
  unit: z.string().min(1, "Unit is required"),
});

export const createRecipeSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  description: z.string().optional().nullable(),
  category: z.string().optional().nullable(),
  yieldQuantity: z.number().min(0.1),
  yieldUnit: z.string(),
  instructions: z.string().optional().nullable(),
  prepTimeMin: z.number().int().min(0).optional().nullable(),
  cookTimeMin: z.number().int().min(0).optional().nullable(),
  difficultyLevel: z.enum(["Easy", "Medium", "Hard"]).optional().nullable(),
  ingredients: z
    .array(recipeIngredientSchema)
    .min(1, "At least one ingredient is required"),
});

export const updateRecipeSchema = createRecipeSchema.partial();

export type CreateRecipeInput = z.infer<typeof createRecipeSchema>;

// ─── Menu Item ───────────────────────────

export const createMenuItemSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  description: z.string().optional().nullable(),
  price: z.number().min(0, "Price must be positive"),
  category: z.string().optional().nullable(),
  recipeId: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
});

export const updateMenuItemSchema = createMenuItemSchema.partial();

export type CreateMenuItemInput = z.infer<typeof createMenuItemSchema>;

// ─── Menu ────────────────────────────────

export const createMenuSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  description: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
  menuItemIds: z.array(z.string()).optional(),
});

export const updateMenuSchema = createMenuSchema.partial();

export type CreateMenuInput = z.infer<typeof createMenuSchema>;

// ─── Transaction ─────────────────────────

export const createTransactionSchema = z.object({
  type: z.enum(["PURCHASE", "USAGE", "WASTE", "ADJUSTMENT"]),
  ingredientId: z.string().min(1, "Ingredient is required"),
  quantity: z.number().min(0.001, "Quantity must be positive"),
  unitCost: z.number().min(0).optional().nullable(),
  supplierId: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export type CreateTransactionInput = z.infer<typeof createTransactionSchema>;

// ─── Auth ──────────────────────────────

export const loginSchema = z.object({
  email: z.string().email("Valid email is required"),
  pin: z.string().optional().nullable(),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const createUserSchema = z.object({
  email: z.string().email("Valid email is required"),
  name: z.string().min(1, "Name is required").max(100),
  role: z.enum(["OWNER", "KITCHEN_MANAGER", "HEAD_CHEF", "SERVER", "HOST"]),
  pin: z
    .string()
    .regex(/^\d{4}$/, "PIN must be exactly 4 digits")
    .optional()
    .nullable(),
});

export const updateUserSchema = createUserSchema.partial();

export type CreateUserInput = z.infer<typeof createUserSchema>;

// ─── Phase 2: Chef ─────────────────────────

export const updateIngredientAllergensSchema = z.object({
  allergenIds: z.array(z.string()),
});

export type UpdateIngredientAllergensInput = z.infer<
  typeof updateIngredientAllergensSchema
>;

export const createPrepTaskSchema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  recipeId: z.string().optional().nullable(),
  assignedToId: z.string().optional().nullable(),
  scheduledFor: z.string().min(1, "Scheduled date is required"),
  estimatedMin: z.number().int().min(1).optional().nullable(),
  notes: z.string().optional().nullable(),
});

export const updatePrepTaskSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  recipeId: z.string().optional().nullable(),
  assignedToId: z.string().optional().nullable(),
  scheduledFor: z.string().optional(),
  estimatedMin: z.number().int().min(1).optional().nullable(),
  status: z.enum(["PENDING", "IN_PROGRESS", "COMPLETED"]).optional(),
  notes: z.string().optional().nullable(),
});

export type CreatePrepTaskInput = z.infer<typeof createPrepTaskSchema>;
export type UpdatePrepTaskInput = z.infer<typeof updatePrepTaskSchema>;

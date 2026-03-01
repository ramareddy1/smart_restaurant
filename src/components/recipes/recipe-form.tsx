"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createRecipeSchema, type CreateRecipeInput } from "@/lib/validators";
import { RECIPE_CATEGORIES, INGREDIENT_UNITS, DIFFICULTY_LEVELS } from "@/lib/constants";
import { useAllIngredients } from "@/hooks/use-ingredients";
import { formatCurrency } from "@/lib/format";

interface RecipeFormProps {
  initialData?: {
    id: string;
    name: string;
    description?: string | null;
    category?: string | null;
    yieldQuantity: number;
    yieldUnit: string;
    instructions?: string | null;
    prepTimeMin?: number | null;
    cookTimeMin?: number | null;
    difficultyLevel?: string | null;
    ingredients: Array<{
      ingredientId: string;
      quantity: number;
      unit: string;
    }>;
  };
}

interface IngredientRow {
  ingredientId: string;
  quantity: number;
  unit: string;
}

export function RecipeForm({ initialData }: RecipeFormProps) {
  const router = useRouter();
  const { ingredients: allIngredients } = useAllIngredients();
  const isEditing = !!initialData;

  const [ingredientRows, setIngredientRows] = useState<IngredientRow[]>(
    initialData?.ingredients ?? [{ ingredientId: "", quantity: 0, unit: "" }]
  );

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CreateRecipeInput>({
    resolver: zodResolver(createRecipeSchema),
    defaultValues: {
      name: initialData?.name ?? "",
      description: initialData?.description ?? "",
      category: initialData?.category ?? "",
      yieldQuantity: initialData?.yieldQuantity ?? 1,
      yieldUnit: initialData?.yieldUnit ?? "serving",
      instructions: initialData?.instructions ?? "",
      prepTimeMin: initialData?.prepTimeMin ?? undefined,
      cookTimeMin: initialData?.cookTimeMin ?? undefined,
      difficultyLevel: initialData?.difficultyLevel as "Easy" | "Medium" | "Hard" | undefined ?? undefined,
      ingredients: initialData?.ingredients ?? [],
    },
  });

  // Calculate total cost
  const totalCost = ingredientRows.reduce((sum, row) => {
    const ing = allIngredients.find(
      (i: { id: string; costPerUnit: number }) => i.id === row.ingredientId
    );
    if (!ing || !row.quantity) return sum;
    return sum + row.quantity * ing.costPerUnit;
  }, 0);

  const addIngredientRow = () => {
    setIngredientRows([
      ...ingredientRows,
      { ingredientId: "", quantity: 0, unit: "" },
    ]);
  };

  const removeIngredientRow = (index: number) => {
    const updated = ingredientRows.filter((_, i) => i !== index);
    setIngredientRows(updated);
    setValue("ingredients", updated);
  };

  const updateIngredientRow = (
    index: number,
    field: keyof IngredientRow,
    value: string | number
  ) => {
    const updated = [...ingredientRows];
    updated[index] = { ...updated[index], [field]: value };

    // Auto-fill unit from ingredient's base unit
    if (field === "ingredientId") {
      const ing = allIngredients.find(
        (i: { id: string; unit: string }) => i.id === value
      );
      if (ing) {
        updated[index].unit = ing.unit;
      }
    }

    setIngredientRows(updated);
    setValue("ingredients", updated);
  };

  const onSubmit = async (data: CreateRecipeInput) => {
    try {
      // Override ingredients with our managed state
      data.ingredients = ingredientRows.filter((r) => r.ingredientId);

      if (data.ingredients.length === 0) {
        toast.error("Add at least one ingredient");
        return;
      }

      const url = isEditing
        ? `/api/recipes/${initialData.id}`
        : "/api/recipes";
      const method = isEditing ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          description: data.description || null,
          category: data.category || null,
          instructions: data.instructions || null,
          prepTimeMin: data.prepTimeMin || null,
          cookTimeMin: data.cookTimeMin || null,
          difficultyLevel: data.difficultyLevel || null,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to save recipe");
      }

      toast.success(isEditing ? "Recipe updated" : "Recipe created");
      router.push("/recipes");
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Something went wrong"
      );
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Recipe Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                {...register("name")}
                placeholder="e.g., Classic Margherita Pizza"
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select
                value={watch("category") ?? ""}
                onValueChange={(v) => setValue("category", v || null)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {RECIPE_CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="yieldQuantity">Yield Quantity</Label>
              <Input
                id="yieldQuantity"
                type="number"
                step="0.1"
                {...register("yieldQuantity", { valueAsNumber: true })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="yieldUnit">Yield Unit</Label>
              <Input
                id="yieldUnit"
                {...register("yieldUnit")}
                placeholder="e.g., servings"
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="prepTimeMin">Prep Time (min)</Label>
              <Input
                id="prepTimeMin"
                type="number"
                min="0"
                {...register("prepTimeMin", { valueAsNumber: true })}
                placeholder="e.g., 15"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cookTimeMin">Cook Time (min)</Label>
              <Input
                id="cookTimeMin"
                type="number"
                min="0"
                {...register("cookTimeMin", { valueAsNumber: true })}
                placeholder="e.g., 30"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="difficultyLevel">Difficulty</Label>
              <Select
                value={watch("difficultyLevel") ?? ""}
                onValueChange={(v) =>
                  setValue("difficultyLevel", (v || null) as "Easy" | "Medium" | "Hard" | null)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select difficulty" />
                </SelectTrigger>
                <SelectContent>
                  {DIFFICULTY_LEVELS.map((level) => (
                    <SelectItem key={level} value={level}>
                      {level}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              {...register("description")}
              placeholder="Brief description of the recipe"
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="instructions">Instructions</Label>
            <Textarea
              id="instructions"
              {...register("instructions")}
              placeholder="Step-by-step cooking instructions..."
              rows={5}
            />
          </div>
        </CardContent>
      </Card>

      {/* Ingredients Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Ingredients</CardTitle>
            <div className="text-sm font-medium">
              Total Cost:{" "}
              <span className="text-lg">{formatCurrency(totalCost)}</span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {ingredientRows.map((row, index) => {
            const selectedIng = allIngredients.find(
              (i: { id: string }) => i.id === row.ingredientId
            );
            const rowCost = selectedIng
              ? row.quantity * selectedIng.costPerUnit
              : 0;

            return (
              <div key={index} className="flex items-end gap-3">
                <div className="flex-1 space-y-1">
                  <Label className="text-xs">Ingredient</Label>
                  <Select
                    value={row.ingredientId}
                    onValueChange={(v) =>
                      updateIngredientRow(index, "ingredientId", v)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select ingredient" />
                    </SelectTrigger>
                    <SelectContent>
                      {allIngredients.map(
                        (ing: { id: string; name: string; unit: string }) => (
                          <SelectItem key={ing.id} value={ing.id}>
                            {ing.name} ({ing.unit})
                          </SelectItem>
                        )
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div className="w-24 space-y-1">
                  <Label className="text-xs">Qty</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={row.quantity || ""}
                    onChange={(e) =>
                      updateIngredientRow(
                        index,
                        "quantity",
                        parseFloat(e.target.value) || 0
                      )
                    }
                  />
                </div>

                <div className="w-24 space-y-1">
                  <Label className="text-xs">Unit</Label>
                  <Select
                    value={row.unit}
                    onValueChange={(v) =>
                      updateIngredientRow(index, "unit", v)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Unit" />
                    </SelectTrigger>
                    <SelectContent>
                      {INGREDIENT_UNITS.map((u) => (
                        <SelectItem key={u} value={u}>
                          {u}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="w-20 text-right text-sm text-muted-foreground pb-2">
                  {rowCost > 0 ? formatCurrency(rowCost) : "—"}
                </div>

                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeIngredientRow(index)}
                  disabled={ingredientRows.length === 1}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            );
          })}

          {errors.ingredients && (
            <p className="text-sm text-destructive">
              {errors.ingredients.message}
            </p>
          )}

          <Button type="button" variant="outline" onClick={addIngredientRow}>
            <Plus className="mr-2 h-4 w-4" /> Add Ingredient
          </Button>
        </CardContent>
      </Card>

      <div className="flex gap-4">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting
            ? "Saving..."
            : isEditing
            ? "Update Recipe"
            : "Create Recipe"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/recipes")}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}

"use client";

import { use } from "react";
import { useRecipe } from "@/hooks/use-recipes";
import { RecipeForm } from "@/components/recipes/recipe-form";
import { PageHeader } from "@/components/shared/page-header";
import { Skeleton } from "@/components/ui/skeleton";

export default function EditRecipePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { recipe, isLoading } = useRecipe(id);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-[600px] w-full" />
      </div>
    );
  }

  if (!recipe) {
    return (
      <div className="space-y-6">
        <PageHeader title="Recipe Not Found" />
        <p className="text-muted-foreground">
          The recipe you are looking for does not exist.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Edit: ${recipe.name}`}
        description="Update recipe details and ingredients"
      />
      <RecipeForm
        initialData={{
          id: recipe.id,
          name: recipe.name,
          description: recipe.description,
          category: recipe.category,
          yieldQuantity: recipe.yieldQuantity,
          yieldUnit: recipe.yieldUnit,
          instructions: recipe.instructions,
          ingredients: recipe.ingredients?.map(
            (ri: { ingredientId: string; quantity: number; unit: string }) => ({
              ingredientId: ri.ingredientId,
              quantity: ri.quantity,
              unit: ri.unit,
            })
          ) ?? [],
        }}
      />
    </div>
  );
}

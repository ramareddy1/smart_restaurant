"use client";

import { use } from "react";
import { useIngredient } from "@/hooks/use-ingredients";
import { IngredientForm } from "@/components/inventory/ingredient-form";
import { PageHeader } from "@/components/shared/page-header";
import { Skeleton } from "@/components/ui/skeleton";

export default function EditIngredientPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { ingredient, isLoading } = useIngredient(id);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  if (!ingredient) {
    return (
      <div className="space-y-6">
        <PageHeader title="Ingredient Not Found" />
        <p className="text-muted-foreground">
          The ingredient you are looking for does not exist.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Edit: ${ingredient.name}`}
        description="Update ingredient details"
      />
      <IngredientForm
        initialData={{
          id: ingredient.id,
          name: ingredient.name,
          category: ingredient.category,
          unit: ingredient.unit,
          currentStock: ingredient.currentStock,
          parLevel: ingredient.parLevel,
          costPerUnit: ingredient.costPerUnit,
          expirationDate: ingredient.expirationDate,
          supplierId: ingredient.supplierId,
        }}
      />
    </div>
  );
}

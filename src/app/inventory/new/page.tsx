import { IngredientForm } from "@/components/inventory/ingredient-form";
import { PageHeader } from "@/components/shared/page-header";

export default function NewIngredientPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Add Ingredient" description="Add a new ingredient to your inventory" />
      <IngredientForm />
    </div>
  );
}

import { RecipeForm } from "@/components/recipes/recipe-form";
import { PageHeader } from "@/components/shared/page-header";

export default function NewRecipePage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Create Recipe" description="Define a new recipe with ingredients" />
      <RecipeForm />
    </div>
  );
}

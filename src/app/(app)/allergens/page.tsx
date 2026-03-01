"use client";

import { useState } from "react";
import { ShieldAlert, Pencil, Loader2 } from "lucide-react";
import useSWR from "swr";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AllergenBadges } from "@/components/allergens/allergen-badges";
import { AllergenSelect } from "@/components/allergens/allergen-select";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface Ingredient {
  id: string;
  name: string;
  category: string;
  unit: string;
  allergens: Array<{
    allergen: { id: string; name: string };
  }>;
}

export default function AllergensPage() {
  const { data, isLoading, mutate } = useSWR<{ items: Ingredient[] }>(
    "/api/ingredients?pageSize=200",
    fetcher
  );
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");

  const ingredients = data?.items ?? [];

  // Filter by search
  const filtered = ingredients.filter(
    (ing) =>
      ing.name.toLowerCase().includes(search.toLowerCase()) ||
      ing.category.toLowerCase().includes(search.toLowerCase())
  );

  // Group by category
  const grouped = filtered.reduce<Record<string, Ingredient[]>>((acc, ing) => {
    if (!acc[ing.category]) acc[ing.category] = [];
    acc[ing.category].push(ing);
    return acc;
  }, {});

  const sortedCategories = Object.keys(grouped).sort();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <ShieldAlert className="h-6 w-6" />
            Allergen Management
          </h1>
          <p className="text-muted-foreground">
            Assign allergens to ingredients. Menu item allergens are auto-computed from their recipes.
          </p>
        </div>
      </div>

      <Input
        placeholder="Search ingredients..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="max-w-sm"
      />

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="space-y-6">
          {sortedCategories.map((category) => (
            <Card key={category}>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">{category}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {grouped[category].map((ing) => {
                    const allergens = ing.allergens.map((a) => a.allergen);
                    return (
                      <div
                        key={ing.id}
                        className="flex items-center justify-between rounded-lg border p-3"
                      >
                        <div className="flex-1">
                          <div className="font-medium text-sm">{ing.name}</div>
                          <div className="mt-1">
                            <AllergenBadges allergens={allergens} size="sm" />
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setEditingId(ing.id);
                            setEditingName(ing.name);
                          }}
                        >
                          <Pencil className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          ))}

          {sortedCategories.length === 0 && (
            <p className="text-center text-muted-foreground py-8">
              No ingredients found.
            </p>
          )}
        </div>
      )}

      {editingId && (
        <AllergenSelect
          ingredientId={editingId}
          ingredientName={editingName}
          open={!!editingId}
          onOpenChange={(open) => {
            if (!open) setEditingId(null);
          }}
          onSaved={() => mutate()}
        />
      )}
    </div>
  );
}

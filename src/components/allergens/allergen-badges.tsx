"use client";

import { Badge } from "@/components/ui/badge";

interface Allergen {
  id: string;
  name: string;
}

const ALLERGEN_COLORS: Record<string, string> = {
  Milk: "bg-blue-100 text-blue-800 border-blue-200",
  Eggs: "bg-yellow-100 text-yellow-800 border-yellow-200",
  Fish: "bg-cyan-100 text-cyan-800 border-cyan-200",
  "Crustacean Shellfish": "bg-red-100 text-red-800 border-red-200",
  "Tree Nuts": "bg-amber-100 text-amber-800 border-amber-200",
  Peanuts: "bg-orange-100 text-orange-800 border-orange-200",
  Wheat: "bg-yellow-100 text-yellow-800 border-yellow-200",
  Soybeans: "bg-green-100 text-green-800 border-green-200",
  Sesame: "bg-stone-100 text-stone-800 border-stone-200",
  Mustard: "bg-yellow-100 text-yellow-800 border-yellow-200",
  Celery: "bg-lime-100 text-lime-800 border-lime-200",
  Lupin: "bg-violet-100 text-violet-800 border-violet-200",
  Mollusks: "bg-teal-100 text-teal-800 border-teal-200",
  Sulfites: "bg-pink-100 text-pink-800 border-pink-200",
};

export function AllergenBadges({
  allergens,
  size = "default",
}: {
  allergens: Allergen[];
  size?: "default" | "sm";
}) {
  if (allergens.length === 0) {
    return (
      <span className="text-xs text-muted-foreground italic">
        No allergens
      </span>
    );
  }

  return (
    <div className="flex flex-wrap gap-1">
      {allergens.map((a) => (
        <Badge
          key={a.id}
          variant="outline"
          className={`${ALLERGEN_COLORS[a.name] ?? "bg-gray-100 text-gray-800 border-gray-200"} ${
            size === "sm" ? "text-[10px] px-1.5 py-0" : "text-xs"
          }`}
        >
          {a.name}
        </Badge>
      ))}
    </div>
  );
}

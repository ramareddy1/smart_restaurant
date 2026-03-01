"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useAllergens, useIngredientAllergens } from "@/hooks/use-allergens";

interface AllergenSelectProps {
  ingredientId: string;
  ingredientName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved?: () => void;
}

export function AllergenSelect({
  ingredientId,
  ingredientName,
  open,
  onOpenChange,
  onSaved,
}: AllergenSelectProps) {
  const { allergens: allAllergens, isLoading: loadingAll } = useAllergens();
  const {
    allergens: currentAllergens,
    isLoading: loadingCurrent,
    mutate,
  } = useIngredientAllergens(open ? ingredientId : null);

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [initialized, setInitialized] = useState(false);
  const [saving, setSaving] = useState(false);

  // Sync selected state when current allergens load
  if (!loadingCurrent && currentAllergens.length >= 0 && !initialized && open) {
    setSelected(
      new Set(currentAllergens.map((a: { id: string }) => a.id))
    );
    setInitialized(true);
  }

  // Reset when dialog closes
  const handleOpenChange = (value: boolean) => {
    if (!value) {
      setInitialized(false);
    }
    onOpenChange(value);
  };

  const toggleAllergen = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/ingredients/${ingredientId}/allergens`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ allergenIds: Array.from(selected) }),
      });

      if (!res.ok) {
        throw new Error("Failed to update allergens");
      }

      toast.success(`Allergens updated for ${ingredientName}`);
      mutate();
      onSaved?.();
      handleOpenChange(false);
    } catch {
      toast.error("Failed to save allergens");
    } finally {
      setSaving(false);
    }
  };

  const isLoading = loadingAll || loadingCurrent;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Allergens for {ingredientName}</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 py-4">
            {allAllergens.map((allergen: { id: string; name: string }) => (
              <div key={allergen.id} className="flex items-center space-x-2">
                <Checkbox
                  id={`allergen-${allergen.id}`}
                  checked={selected.has(allergen.id)}
                  onCheckedChange={() => toggleAllergen(allergen.id)}
                />
                <Label
                  htmlFor={`allergen-${allergen.id}`}
                  className="text-sm cursor-pointer"
                >
                  {allergen.name}
                </Label>
              </div>
            ))}
          </div>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving || isLoading}>
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              `Save (${selected.size} selected)`
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

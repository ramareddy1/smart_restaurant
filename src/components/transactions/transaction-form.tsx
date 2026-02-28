"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

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
import {
  createTransactionSchema,
  type CreateTransactionInput,
} from "@/lib/validators";
import { TRANSACTION_TYPES } from "@/lib/constants";
import { useAllIngredients } from "@/hooks/use-ingredients";
import { useAllSuppliers } from "@/hooks/use-suppliers";

export function TransactionForm() {
  const router = useRouter();
  const { ingredients } = useAllIngredients();
  const { suppliers } = useAllSuppliers();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CreateTransactionInput>({
    resolver: zodResolver(createTransactionSchema),
    defaultValues: {
      type: "PURCHASE",
      ingredientId: "",
      quantity: 0,
      unitCost: undefined,
      supplierId: "",
      notes: "",
    },
  });

  const txType = watch("type");
  const selectedIngredientId = watch("ingredientId");
  const isPurchase = txType === "PURCHASE";

  const selectedIngredient = ingredients.find(
    (i: { id: string }) => i.id === selectedIngredientId
  );

  const onSubmit = async (data: CreateTransactionInput) => {
    try {
      const res = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          unitCost: data.unitCost || null,
          supplierId: data.supplierId || null,
          notes: data.notes || null,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to record transaction");
      }

      toast.success("Transaction recorded successfully");
      router.push("/transactions");
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Something went wrong"
      );
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Record Transaction</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Type */}
            <div className="space-y-2">
              <Label htmlFor="type">Type *</Label>
              <Select
                value={watch("type")}
                onValueChange={(v) =>
                  setValue(
                    "type",
                    v as "PURCHASE" | "USAGE" | "WASTE" | "ADJUSTMENT"
                  )
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {TRANSACTION_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.type && (
                <p className="text-sm text-destructive">{errors.type.message}</p>
              )}
            </div>

            {/* Ingredient */}
            <div className="space-y-2">
              <Label htmlFor="ingredientId">Ingredient *</Label>
              <Select
                value={watch("ingredientId")}
                onValueChange={(v) => setValue("ingredientId", v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select ingredient" />
                </SelectTrigger>
                <SelectContent>
                  {ingredients.map(
                    (ing: {
                      id: string;
                      name: string;
                      currentStock: number;
                      unit: string;
                    }) => (
                      <SelectItem key={ing.id} value={ing.id}>
                        {ing.name} (stock: {ing.currentStock} {ing.unit})
                      </SelectItem>
                    )
                  )}
                </SelectContent>
              </Select>
              {errors.ingredientId && (
                <p className="text-sm text-destructive">
                  {errors.ingredientId.message}
                </p>
              )}
            </div>

            {/* Quantity */}
            <div className="space-y-2">
              <Label htmlFor="quantity">
                Quantity *{" "}
                {selectedIngredient && (
                  <span className="text-muted-foreground font-normal">
                    ({selectedIngredient.unit})
                  </span>
                )}
              </Label>
              <Input
                id="quantity"
                type="number"
                step="0.01"
                {...register("quantity", { valueAsNumber: true })}
              />
              {errors.quantity && (
                <p className="text-sm text-destructive">
                  {errors.quantity.message}
                </p>
              )}
            </div>

            {/* Unit Cost (only for Purchase) */}
            {isPurchase && (
              <div className="space-y-2">
                <Label htmlFor="unitCost">Unit Cost ($)</Label>
                <Input
                  id="unitCost"
                  type="number"
                  step="0.01"
                  {...register("unitCost", { valueAsNumber: true })}
                  placeholder="Cost per unit"
                />
              </div>
            )}

            {/* Supplier (only for Purchase) */}
            {isPurchase && (
              <div className="space-y-2">
                <Label htmlFor="supplierId">Supplier</Label>
                <Select
                  value={watch("supplierId") || "__none__"}
                  onValueChange={(v) => setValue("supplierId", v === "__none__" ? null : v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select supplier (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">None</SelectItem>
                    {suppliers.map(
                      (s: { id: string; name: string }) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.name}
                        </SelectItem>
                      )
                    )}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              {...register("notes")}
              placeholder="Optional notes about this transaction"
              rows={2}
            />
          </div>

          {/* Stock Info */}
          {selectedIngredient && (
            <div className="rounded-lg bg-muted p-4 text-sm">
              <p>
                <strong>{selectedIngredient.name}</strong> — Current stock:{" "}
                {selectedIngredient.currentStock} {selectedIngredient.unit} | Par
                level: {selectedIngredient.parLevel} {selectedIngredient.unit}
              </p>
            </div>
          )}

          <div className="flex gap-4">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Recording..." : "Record Transaction"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/transactions")}
            >
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

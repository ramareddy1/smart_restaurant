"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createIngredientSchema, type CreateIngredientInput } from "@/lib/validators";
import { INGREDIENT_CATEGORIES, INGREDIENT_UNITS } from "@/lib/constants";
import { useAllSuppliers } from "@/hooks/use-suppliers";

interface IngredientFormProps {
  initialData?: {
    id: string;
    name: string;
    category: string;
    unit: string;
    currentStock: number;
    parLevel: number;
    costPerUnit: number;
    expirationDate?: string | null;
    supplierId?: string | null;
  };
}

export function IngredientForm({ initialData }: IngredientFormProps) {
  const router = useRouter();
  const { suppliers } = useAllSuppliers();
  const isEditing = !!initialData;

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CreateIngredientInput>({
    resolver: zodResolver(createIngredientSchema),
    defaultValues: {
      name: initialData?.name ?? "",
      category: initialData?.category ?? "",
      unit: initialData?.unit ?? "",
      currentStock: initialData?.currentStock ?? 0,
      parLevel: initialData?.parLevel ?? 0,
      costPerUnit: initialData?.costPerUnit ?? 0,
      expirationDate: initialData?.expirationDate
        ? initialData.expirationDate.split("T")[0]
        : "",
      supplierId: initialData?.supplierId ?? "",
    },
  });

  const onSubmit = async (data: CreateIngredientInput) => {
    try {
      const url = isEditing
        ? `/api/ingredients/${initialData.id}`
        : "/api/ingredients";
      const method = isEditing ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          expirationDate: data.expirationDate || null,
          supplierId: data.supplierId || null,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to save ingredient");
      }

      toast.success(
        isEditing ? "Ingredient updated" : "Ingredient created"
      );
      router.push("/inventory");
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
        <CardTitle>{isEditing ? "Edit Ingredient" : "Add Ingredient"}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input id="name" {...register("name")} placeholder="e.g., Tomatoes" />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name.message}</p>
              )}
            </div>

            {/* Category */}
            <div className="space-y-2">
              <Label htmlFor="category">Category *</Label>
              <Select
                value={watch("category")}
                onValueChange={(v) => setValue("category", v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {INGREDIENT_CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.category && (
                <p className="text-sm text-destructive">
                  {errors.category.message}
                </p>
              )}
            </div>

            {/* Unit */}
            <div className="space-y-2">
              <Label htmlFor="unit">Unit *</Label>
              <Select
                value={watch("unit")}
                onValueChange={(v) => setValue("unit", v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select unit" />
                </SelectTrigger>
                <SelectContent>
                  {INGREDIENT_UNITS.map((u) => (
                    <SelectItem key={u} value={u}>
                      {u}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.unit && (
                <p className="text-sm text-destructive">{errors.unit.message}</p>
              )}
            </div>

            {/* Current Stock */}
            <div className="space-y-2">
              <Label htmlFor="currentStock">Current Stock</Label>
              <Input
                id="currentStock"
                type="number"
                step="0.01"
                {...register("currentStock", { valueAsNumber: true })}
              />
              {errors.currentStock && (
                <p className="text-sm text-destructive">
                  {errors.currentStock.message}
                </p>
              )}
            </div>

            {/* Par Level */}
            <div className="space-y-2">
              <Label htmlFor="parLevel">Par Level *</Label>
              <Input
                id="parLevel"
                type="number"
                step="0.01"
                {...register("parLevel", { valueAsNumber: true })}
                placeholder="Minimum desired stock"
              />
              {errors.parLevel && (
                <p className="text-sm text-destructive">
                  {errors.parLevel.message}
                </p>
              )}
            </div>

            {/* Cost Per Unit */}
            <div className="space-y-2">
              <Label htmlFor="costPerUnit">Cost Per Unit ($) *</Label>
              <Input
                id="costPerUnit"
                type="number"
                step="0.01"
                {...register("costPerUnit", { valueAsNumber: true })}
              />
              {errors.costPerUnit && (
                <p className="text-sm text-destructive">
                  {errors.costPerUnit.message}
                </p>
              )}
            </div>

            {/* Expiration Date */}
            <div className="space-y-2">
              <Label htmlFor="expirationDate">Expiration Date</Label>
              <Input
                id="expirationDate"
                type="date"
                {...register("expirationDate")}
              />
            </div>

            {/* Supplier */}
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
          </div>

          <div className="flex gap-4">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting
                ? "Saving..."
                : isEditing
                ? "Update Ingredient"
                : "Create Ingredient"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/inventory")}
            >
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

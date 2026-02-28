"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createMenuItemSchema, type CreateMenuItemInput } from "@/lib/validators";
import { MENU_ITEM_CATEGORIES } from "@/lib/constants";
import { useRecipes } from "@/hooks/use-recipes";

interface MenuItemFormProps {
  initialData?: {
    id: string;
    name: string;
    description?: string | null;
    price: number;
    category?: string | null;
    recipeId?: string | null;
    isActive?: boolean;
  };
}

export function MenuItemForm({ initialData }: MenuItemFormProps) {
  const router = useRouter();
  const { recipes } = useRecipes();
  const isEditing = !!initialData;

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CreateMenuItemInput>({
    resolver: zodResolver(createMenuItemSchema),
    defaultValues: {
      name: initialData?.name ?? "",
      description: initialData?.description ?? "",
      price: initialData?.price ?? 0,
      category: initialData?.category ?? "",
      recipeId: initialData?.recipeId ?? "",
      isActive: initialData?.isActive ?? true,
    },
  });

  const onSubmit = async (data: CreateMenuItemInput) => {
    try {
      const url = isEditing
        ? `/api/menu-items/${initialData.id}`
        : "/api/menu-items";
      const method = isEditing ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          description: data.description || null,
          category: data.category || null,
          recipeId: data.recipeId || null,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to save menu item");
      }

      toast.success(
        isEditing ? "Menu item updated" : "Menu item created"
      );
      router.push("/menu-items");
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
        <CardTitle>{isEditing ? "Edit Menu Item" : "Add Menu Item"}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                {...register("name")}
                placeholder="e.g., Caesar Salad"
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name.message}</p>
              )}
            </div>

            {/* Price */}
            <div className="space-y-2">
              <Label htmlFor="price">Price ($) *</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                {...register("price", { valueAsNumber: true })}
                placeholder="0.00"
              />
              {errors.price && (
                <p className="text-sm text-destructive">{errors.price.message}</p>
              )}
            </div>

            {/* Category */}
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select
                value={watch("category") || "__none__"}
                onValueChange={(v) => setValue("category", v === "__none__" ? null : v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">None</SelectItem>
                  {MENU_ITEM_CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Recipe */}
            <div className="space-y-2">
              <Label htmlFor="recipeId">Link to Recipe</Label>
              <Select
                value={watch("recipeId") || "__none__"}
                onValueChange={(v) => setValue("recipeId", v === "__none__" ? null : v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select recipe (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">None</SelectItem>
                  {recipes.map(
                    (r: { id: string; name: string }) => (
                      <SelectItem key={r.id} value={r.id}>
                        {r.name}
                      </SelectItem>
                    )
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              {...register("description")}
              placeholder="Brief description of the menu item"
              rows={3}
            />
          </div>

          {/* Active Toggle */}
          <div className="flex items-center gap-3">
            <Switch
              id="isActive"
              checked={watch("isActive") ?? true}
              onCheckedChange={(checked) => setValue("isActive", checked)}
            />
            <Label htmlFor="isActive">Active</Label>
          </div>

          <div className="flex gap-4">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting
                ? "Saving..."
                : isEditing
                ? "Update Menu Item"
                : "Create Menu Item"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/menu-items")}
            >
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

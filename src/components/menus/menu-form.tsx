"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { createMenuSchema, type CreateMenuInput } from "@/lib/validators";
import { useAllMenuItems } from "@/hooks/use-menus";
import { formatCurrency } from "@/lib/format";

interface MenuFormProps {
  initialData?: {
    id: string;
    name: string;
    description?: string | null;
    isActive: boolean;
    items?: Array<{ menuItemId: string }>;
  };
}

export function MenuForm({ initialData }: MenuFormProps) {
  const router = useRouter();
  const { menuItems } = useAllMenuItems();
  const isEditing = !!initialData;

  const [selectedItemIds, setSelectedItemIds] = useState<string[]>(
    initialData?.items?.map((i) => i.menuItemId) ?? []
  );

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CreateMenuInput>({
    resolver: zodResolver(createMenuSchema),
    defaultValues: {
      name: initialData?.name ?? "",
      description: initialData?.description ?? "",
      isActive: initialData?.isActive ?? true,
      menuItemIds: initialData?.items?.map((i) => i.menuItemId) ?? [],
    },
  });

  const toggleItem = (itemId: string) => {
    const updated = selectedItemIds.includes(itemId)
      ? selectedItemIds.filter((id) => id !== itemId)
      : [...selectedItemIds, itemId];
    setSelectedItemIds(updated);
    setValue("menuItemIds", updated);
  };

  const onSubmit = async (data: CreateMenuInput) => {
    try {
      data.menuItemIds = selectedItemIds;

      const url = isEditing ? `/api/menus/${initialData.id}` : "/api/menus";
      const method = isEditing ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          description: data.description || null,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to save menu");
      }

      toast.success(isEditing ? "Menu updated" : "Menu created");
      router.push("/menus");
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Something went wrong"
      );
    }
  };

  type MenuItemEntry = { id: string; name: string; price: number; category: string | null };

  // Group menu items by category
  const grouped: Map<string, MenuItemEntry[]> = new Map();
  for (const item of menuItems as MenuItemEntry[]) {
    const cat = item.category ?? "Other";
    if (!grouped.has(cat)) grouped.set(cat, []);
    grouped.get(cat)!.push(item);
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Menu Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                {...register("name")}
                placeholder="e.g., Dinner Menu"
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name.message}</p>
              )}
            </div>

            <div className="flex items-center space-x-2 pt-8">
              <Switch
                checked={watch("isActive")}
                onCheckedChange={(v) => setValue("isActive", v)}
              />
              <Label>Active</Label>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              {...register("description")}
              placeholder="Brief description of this menu"
              rows={2}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Menu Items</CardTitle>
            <Badge variant="secondary">
              {selectedItemIds.length} selected
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {grouped.size === 0 ? (
            <p className="text-sm text-muted-foreground">
              No menu items available. Create some first.
            </p>
          ) : (
            <div className="space-y-6">
              {Array.from(grouped.entries()).map(([category, items]) => (
                <div key={category}>
                  <h4 className="text-sm font-semibold text-muted-foreground mb-2">
                    {category}
                  </h4>
                  <div className="space-y-2">
                    {items.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center space-x-3 rounded-lg border p-3"
                      >
                        <Checkbox
                          checked={selectedItemIds.includes(item.id)}
                          onCheckedChange={() => toggleItem(item.id)}
                        />
                        <div className="flex-1">
                          <span className="font-medium">{item.name}</span>
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {formatCurrency(item.price)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex gap-4">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting
            ? "Saving..."
            : isEditing
            ? "Update Menu"
            : "Create Menu"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/menus")}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}

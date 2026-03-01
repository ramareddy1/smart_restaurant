"use client";

import { use } from "react";
import { useMenuItem } from "@/hooks/use-menus";
import { MenuItemForm } from "@/components/menu-items/menu-item-form";
import { PageHeader } from "@/components/shared/page-header";
import { Skeleton } from "@/components/ui/skeleton";

export default function EditMenuItemPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { menuItem, isLoading } = useMenuItem(id);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  if (!menuItem) {
    return (
      <div className="space-y-6">
        <PageHeader title="Menu Item Not Found" />
        <p className="text-muted-foreground">
          The menu item you are looking for does not exist.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Edit: ${menuItem.name}`}
        description="Update menu item details"
      />
      <MenuItemForm
        initialData={{
          id: menuItem.id,
          name: menuItem.name,
          description: menuItem.description,
          price: menuItem.price,
          category: menuItem.category,
          recipeId: menuItem.recipeId,
          isActive: menuItem.isActive,
        }}
      />
    </div>
  );
}

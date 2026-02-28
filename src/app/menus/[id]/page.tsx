"use client";

import { use } from "react";
import { useMenu } from "@/hooks/use-menus";
import { MenuForm } from "@/components/menus/menu-form";
import { PageHeader } from "@/components/shared/page-header";
import { Skeleton } from "@/components/ui/skeleton";

export default function EditMenuPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { menu, isLoading } = useMenu(id);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-[500px] w-full" />
      </div>
    );
  }

  if (!menu) {
    return (
      <div className="space-y-6">
        <PageHeader title="Menu Not Found" />
        <p className="text-muted-foreground">
          The menu you are looking for does not exist.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Edit: ${menu.name}`}
        description="Update menu details and items"
      />
      <MenuForm
        initialData={{
          id: menu.id,
          name: menu.name,
          description: menu.description,
          isActive: menu.isActive,
          items: menu.items,
        }}
      />
    </div>
  );
}

"use client";

import { use } from "react";
import { useSupplier } from "@/hooks/use-suppliers";
import { SupplierForm } from "@/components/suppliers/supplier-form";
import { PageHeader } from "@/components/shared/page-header";
import { Skeleton } from "@/components/ui/skeleton";

export default function EditSupplierPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { supplier, isLoading } = useSupplier(id);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  if (!supplier) {
    return (
      <div className="space-y-6">
        <PageHeader title="Supplier Not Found" />
        <p className="text-muted-foreground">
          The supplier you are looking for does not exist.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Edit: ${supplier.name}`}
        description="Update supplier details"
      />
      <SupplierForm
        initialData={{
          id: supplier.id,
          name: supplier.name,
          contactEmail: supplier.contactEmail,
          contactPhone: supplier.contactPhone,
          address: supplier.address,
          notes: supplier.notes,
        }}
      />
    </div>
  );
}

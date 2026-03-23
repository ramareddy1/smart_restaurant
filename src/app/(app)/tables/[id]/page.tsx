"use client";

import { use } from "react";
import { Loader2 } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { TableForm } from "@/components/tables/table-form";
import { useTable } from "@/hooks/use-tables";

export default function EditTablePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { table, isLoading } = useTable(id);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!table) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Table not found
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Edit Table ${table.number}`}
        description="Update table details"
      />
      <TableForm initialData={table} />
    </div>
  );
}

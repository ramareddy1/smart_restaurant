"use client";

import { PageHeader } from "@/components/shared/page-header";
import { TableForm } from "@/components/tables/table-form";

export default function NewTablePage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Add Table" description="Add a new table to the floor" />
      <TableForm />
    </div>
  );
}

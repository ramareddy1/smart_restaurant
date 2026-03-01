import { SupplierForm } from "@/components/suppliers/supplier-form";
import { PageHeader } from "@/components/shared/page-header";

export default function NewSupplierPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Add Supplier" description="Add a new supplier to your network" />
      <SupplierForm />
    </div>
  );
}

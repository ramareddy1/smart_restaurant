import { TransactionForm } from "@/components/transactions/transaction-form";
import { PageHeader } from "@/components/shared/page-header";

export default function NewTransactionPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Record Transaction"
        description="Log a purchase, usage, waste, or stock adjustment"
      />
      <TransactionForm />
    </div>
  );
}

"use client";

import { useRouter } from "next/navigation";
import { Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTables } from "@/hooks/use-tables";
import { TableCard } from "@/components/tables/table-card";
import { PageHeader } from "@/components/shared/page-header";

export default function TablesPage() {
  const router = useRouter();
  const { tables, isLoading, mutate } = useTables();

  async function handleStatusToggle(
    tableId: string,
    currentStatus: string,
    e: React.MouseEvent
  ) {
    e.stopPropagation();
    const newStatus = currentStatus === "CLEANING" ? "AVAILABLE" : currentStatus;
    if (currentStatus !== "CLEANING") return;

    await fetch(`/api/tables/${tableId}/status`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    mutate();
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const statusOrder = ["OCCUPIED", "RESERVED", "CLEANING", "AVAILABLE"];
  const sorted = [...tables].sort(
    (a: { status: string; number: number }, b: { status: string; number: number }) =>
      statusOrder.indexOf(a.status) - statusOrder.indexOf(b.status) ||
      a.number - b.number
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader
          title="Tables"
          description="Manage restaurant floor and table status"
        />
        <Button onClick={() => router.push("/tables/new")}>
          <Plus className="h-4 w-4 mr-2" />
          Add Table
        </Button>
      </div>

      {/* Summary */}
      <div className="flex gap-4 text-sm text-muted-foreground">
        <span>
          {tables.filter((t: { status: string }) => t.status === "AVAILABLE").length} available
        </span>
        <span>
          {tables.filter((t: { status: string }) => t.status === "OCCUPIED").length} occupied
        </span>
        <span>
          {tables.filter((t: { status: string }) => t.status === "RESERVED").length} reserved
        </span>
        <span>
          {tables.filter((t: { status: string }) => t.status === "CLEANING").length} cleaning
        </span>
      </div>

      {tables.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <p>No tables set up yet.</p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => router.push("/tables/new")}
          >
            Add your first table
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {sorted.map((table: {
            id: string;
            number: number;
            name: string | null;
            seats: number;
            status: string;
            orders: Array<{ id: string; orderNumber: string; status: string; guestCount: number }>;
          }) => (
            <div key={table.id} className="relative">
              <TableCard
                table={table}
                onClick={() => {
                  if (table.status === "OCCUPIED" && table.orders[0]) {
                    router.push(`/orders/${table.orders[0].id}`);
                  } else if (table.status === "AVAILABLE") {
                    router.push(`/orders/new?tableId=${table.id}`);
                  } else {
                    router.push(`/tables/${table.id}`);
                  }
                }}
              />
              {table.status === "CLEANING" && (
                <Button
                  variant="outline"
                  size="sm"
                  className="absolute top-1 right-1 h-6 text-xs"
                  onClick={(e) => handleStatusToggle(table.id, table.status, e)}
                >
                  Clear
                </Button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

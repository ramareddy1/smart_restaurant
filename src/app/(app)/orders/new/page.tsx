"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Send, Save, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTables } from "@/hooks/use-tables";
import useSWR from "swr";
import { PageHeader } from "@/components/shared/page-header";
import {
  OrderItemPicker,
  type SelectedOrderItem,
} from "@/components/orders/order-item-picker";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

function NewOrderForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedTableId = searchParams.get("tableId") ?? "";

  const { tables, isLoading: loadingTables } = useTables();
  const { data: menuItemsData, isLoading: loadingMenu } = useSWR(
    "/api/menu-items?pageSize=200",
    fetcher
  );

  const [tableId, setTableId] = useState(preselectedTableId);
  const [guestCount, setGuestCount] = useState(2);
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<SelectedOrderItem[]>([]);
  const [saving, setSaving] = useState(false);

  const menuItems = (menuItemsData?.items ?? []).filter(
    (mi: { isActive: boolean }) => mi.isActive
  );

  const isLoading = loadingTables || loadingMenu;

  async function handleSubmit(sendToKitchen: boolean) {
    if (!tableId) {
      alert("Please select a table");
      return;
    }
    if (items.length === 0) {
      alert("Please add at least one item");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tableId,
          guestCount,
          notes: notes || null,
          items: items.map((i) => ({
            menuItemId: i.menuItemId,
            quantity: i.quantity,
            specialInstructions: i.specialInstructions || null,
          })),
        }),
      });

      if (!res.ok) throw new Error("Failed to create order");
      const order = await res.json();

      if (sendToKitchen) {
        await fetch(`/api/orders/${order.id}/send-to-kitchen`, {
          method: "PUT",
        });
      }

      router.push(`/orders/${order.id}`);
    } catch {
      alert("Failed to create order");
    } finally {
      setSaving(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const availableTables = tables.filter(
    (t: { status: string; id: string }) =>
      t.status === "AVAILABLE" ||
      t.status === "OCCUPIED" ||
      t.id === preselectedTableId
  );

  return (
    <div className="space-y-6">
      {/* Order Header */}
      <div className="grid gap-4 md:grid-cols-3">
        <div>
          <Label>Table</Label>
          <Select value={tableId} onValueChange={setTableId}>
            <SelectTrigger>
              <SelectValue placeholder="Select table..." />
            </SelectTrigger>
            <SelectContent>
              {availableTables.map(
                (t: { id: string; number: number; seats: number; status: string }) => (
                  <SelectItem key={t.id} value={t.id}>
                    Table {t.number} ({t.seats} seats){" "}
                    {t.status === "OCCUPIED" ? "- Occupied" : ""}
                  </SelectItem>
                )
              )}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Guests</Label>
          <Input
            type="number"
            min={1}
            value={guestCount}
            onChange={(e) => setGuestCount(parseInt(e.target.value) || 1)}
          />
        </div>
        <div>
          <Label>Notes</Label>
          <Input
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Special occasion, allergies..."
          />
        </div>
      </div>

      {/* Menu Item Picker */}
      <OrderItemPicker
        menuItems={menuItems}
        selectedItems={items}
        onItemsChange={setItems}
      />

      {/* Actions */}
      <div className="flex gap-3 justify-end">
        <Button variant="outline" onClick={() => router.push("/orders")}>
          Cancel
        </Button>
        <Button
          variant="outline"
          disabled={saving || items.length === 0}
          onClick={() => handleSubmit(false)}
        >
          <Save className="h-4 w-4 mr-2" />
          Save Draft
        </Button>
        <Button
          disabled={saving || items.length === 0}
          onClick={() => handleSubmit(true)}
        >
          <Send className="h-4 w-4 mr-2" />
          {saving ? "Sending..." : "Send to Kitchen"}
        </Button>
      </div>
    </div>
  );
}

export default function NewOrderPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="New Order"
        description="Take a new order for a table"
      />
      <Suspense
        fallback={
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        }
      >
        <NewOrderForm />
      </Suspense>
    </div>
  );
}

"use client";

import { useState, useEffect, useCallback } from "react";
import { Monitor, RefreshCw, Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useActiveOrders } from "@/hooks/use-orders";
import { KDSOrderCard } from "@/components/kitchen-display/kds-order-card";

export default function KitchenDisplayPage() {
  const { orders, isLoading, mutate } = useActiveOrders();
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [prevCount, setPrevCount] = useState(0);

  // Filter to only show orders that have items in kitchen
  const kitchenOrders = (orders ?? []).filter(
    (o: {
      status: string;
      items: Array<{ status: string }>;
    }) =>
      ["SENT_TO_KITCHEN", "PREPARING", "READY"].includes(o.status) &&
      o.items.some(
        (i: { status: string }) =>
          i.status === "PREPARING" || i.status === "READY"
      )
  );

  // Sort by creation time (oldest first — FIFO)
  const sortedOrders = [...kitchenOrders].sort(
    (a: { createdAt: string }, b: { createdAt: string }) =>
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );

  // Play sound on new orders
  useEffect(() => {
    if (soundEnabled && kitchenOrders.length > prevCount && prevCount > 0) {
      try {
        const ctx = new AudioContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.value = 800;
        gain.gain.value = 0.3;
        osc.start();
        osc.stop(ctx.currentTime + 0.2);
      } catch {
        // Audio not available
      }
    }
    setPrevCount(kitchenOrders.length);
  }, [kitchenOrders.length, soundEnabled, prevCount]);

  const handleItemReady = useCallback(
    async (itemId: string) => {
      await fetch(`/api/order-items/${itemId}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "READY" }),
      });
      mutate();
    },
    [mutate]
  );

  const handleAllReady = useCallback(
    async (orderId: string) => {
      const order = kitchenOrders.find(
        (o: { id: string }) => o.id === orderId
      );
      if (!order) return;

      const preparingItems = order.items.filter(
        (i: { status: string }) => i.status === "PREPARING"
      );
      await Promise.all(
        preparingItems.map((item: { id: string }) =>
          fetch(`/api/order-items/${item.id}/status`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: "READY" }),
          })
        )
      );
      mutate();
    },
    [kitchenOrders, mutate]
  );

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Monitor className="h-6 w-6" />
          <h1 className="text-2xl font-bold">Kitchen Display</h1>
          <Badge variant="secondary">{sortedOrders.length} orders</Badge>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSoundEnabled(!soundEnabled)}
          >
            {soundEnabled ? (
              <Volume2 className="h-4 w-4" />
            ) : (
              <VolumeX className="h-4 w-4" />
            )}
          </Button>
          <Button variant="outline" size="sm" onClick={() => mutate()}>
            <RefreshCw className="h-4 w-4 mr-1" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Orders Grid */}
      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">
          Loading kitchen orders...
        </div>
      ) : sortedOrders.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Monitor className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p className="text-lg font-medium">No active kitchen orders</p>
          <p className="text-sm">Orders will appear here when sent to kitchen</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {sortedOrders.map(
            (order: {
              id: string;
              orderNumber: string;
              status: string;
              createdAt: string;
              table: { number: number };
              items: Array<{
                id: string;
                quantity: number;
                specialInstructions: string | null;
                status: string;
                menuItem: { name: string };
              }>;
            }) => (
              <KDSOrderCard
                key={order.id}
                order={order}
                onItemReady={handleItemReady}
                onAllReady={handleAllReady}
              />
            )
          )}
        </div>
      )}
    </div>
  );
}

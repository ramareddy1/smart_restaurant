"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useOrders } from "@/hooks/use-orders";
import { OrderCard } from "@/components/orders/order-card";
import { PageHeader } from "@/components/shared/page-header";

export default function OrdersPage() {
  const router = useRouter();
  const [tab, setTab] = useState("ACTIVE");

  const { orders, isLoading } = useOrders({
    status: tab === "ALL" ? undefined : tab,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Group active orders by status for the board view
  const statusGroups = [
    { key: "OPEN", label: "Open", orders: orders.filter((o: { status: string }) => o.status === "OPEN") },
    {
      key: "PREPARING",
      label: "In Kitchen",
      orders: orders.filter((o: { status: string }) =>
        ["SENT_TO_KITCHEN", "PREPARING"].includes(o.status)
      ),
    },
    { key: "READY", label: "Ready", orders: orders.filter((o: { status: string }) => o.status === "READY") },
    { key: "SERVED", label: "Served", orders: orders.filter((o: { status: string }) => o.status === "SERVED") },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader title="Orders" description="Active and recent orders" />
        <Button onClick={() => router.push("/orders/new")}>
          <Plus className="h-4 w-4 mr-2" />
          New Order
        </Button>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="ACTIVE">Active</TabsTrigger>
          <TabsTrigger value="CLOSED">Closed</TabsTrigger>
          <TabsTrigger value="ALL">All</TabsTrigger>
        </TabsList>

        <TabsContent value="ACTIVE" className="mt-4">
          {orders.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>No active orders.</p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => router.push("/orders/new")}
              >
                Take a new order
              </Button>
            </div>
          ) : (
            <div className="grid gap-6 lg:grid-cols-4">
              {statusGroups.map((group) => (
                <div key={group.key}>
                  <h3 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wide">
                    {group.label}{" "}
                    <span className="text-muted-foreground/50">
                      ({group.orders.length})
                    </span>
                  </h3>
                  <div className="space-y-3">
                    {group.orders.map(
                      (order: {
                        id: string;
                        orderNumber: string;
                        status: string;
                        guestCount: number;
                        createdAt: string;
                        total: number;
                        table: { number: number; name: string | null };
                        server: { name: string };
                        items: Array<{
                          id: string;
                          quantity: number;
                          menuItem: { name: string };
                        }>;
                      }) => (
                        <OrderCard key={order.id} order={order} />
                      )
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="CLOSED" className="mt-4">
          {orders.length === 0 ? (
            <p className="text-center py-12 text-muted-foreground">
              No closed orders today.
            </p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {orders.map(
                (order: {
                  id: string;
                  orderNumber: string;
                  status: string;
                  guestCount: number;
                  createdAt: string;
                  total: number;
                  table: { number: number; name: string | null };
                  server: { name: string };
                  items: Array<{
                    id: string;
                    quantity: number;
                    menuItem: { name: string };
                  }>;
                }) => (
                  <OrderCard key={order.id} order={order} />
                )
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="ALL" className="mt-4">
          {orders.length === 0 ? (
            <p className="text-center py-12 text-muted-foreground">
              No orders yet.
            </p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {orders.map(
                (order: {
                  id: string;
                  orderNumber: string;
                  status: string;
                  guestCount: number;
                  createdAt: string;
                  total: number;
                  table: { number: number; name: string | null };
                  server: { name: string };
                  items: Array<{
                    id: string;
                    quantity: number;
                    menuItem: { name: string };
                  }>;
                }) => (
                  <OrderCard key={order.id} order={order} />
                )
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

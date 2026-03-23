"use client";

import { useState } from "react";
import { Clock, Check, CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { OrderItemStatusBadge } from "@/components/orders/order-status-badge";

interface KDSOrderCardProps {
  order: {
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
  };
  onItemReady: (itemId: string) => void;
  onAllReady: (orderId: string) => void;
}

export function KDSOrderCard({
  order,
  onItemReady,
  onAllReady,
}: KDSOrderCardProps) {
  const [loading, setLoading] = useState<string | null>(null);

  const kitchenItems = order.items.filter(
    (i) => i.status === "PREPARING" || i.status === "READY"
  );

  const allReady = kitchenItems.every((i) => i.status === "READY");
  const elapsed = Math.round(
    (Date.now() - new Date(order.createdAt).getTime()) / 60000
  );

  async function handleItemReady(itemId: string) {
    setLoading(itemId);
    await onItemReady(itemId);
    setLoading(null);
  }

  return (
    <Card
      className={`${
        elapsed > 20
          ? "border-red-300 bg-red-50/30"
          : elapsed > 10
          ? "border-amber-300 bg-amber-50/30"
          : ""
      }`}
    >
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold">{order.orderNumber}</span>
            <Badge variant="outline">Table {order.table.number}</Badge>
          </div>
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span
              className={`font-medium ${
                elapsed > 20
                  ? "text-red-600"
                  : elapsed > 10
                  ? "text-amber-600"
                  : ""
              }`}
            >
              {elapsed} min
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {kitchenItems.map((item) => (
          <div
            key={item.id}
            className={`flex items-center justify-between rounded-lg border p-2 ${
              item.status === "READY" ? "bg-green-50 border-green-200" : ""
            }`}
          >
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm">
                  {item.quantity}x {item.menuItem.name}
                </span>
                <OrderItemStatusBadge status={item.status} />
              </div>
              {item.specialInstructions && (
                <p className="text-xs text-red-600 mt-0.5 font-medium">
                  {item.specialInstructions}
                </p>
              )}
            </div>
            {item.status === "PREPARING" && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleItemReady(item.id)}
                disabled={loading === item.id}
              >
                <Check className="h-4 w-4 mr-1" />
                Ready
              </Button>
            )}
          </div>
        ))}

        {kitchenItems.length > 0 && !allReady && (
          <Button
            className="w-full mt-2"
            onClick={() => onAllReady(order.id)}
            variant="outline"
          >
            <CheckCheck className="h-4 w-4 mr-1" />
            Mark All Ready
          </Button>
        )}

        {allReady && kitchenItems.length > 0 && (
          <div className="text-center py-2 text-green-600 font-medium text-sm">
            All items ready for pickup
          </div>
        )}
      </CardContent>
    </Card>
  );
}

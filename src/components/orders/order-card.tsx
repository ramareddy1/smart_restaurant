"use client";

import Link from "next/link";
import { Clock, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { OrderStatusBadge } from "./order-status-badge";
import { formatRelativeDate } from "@/lib/format";

interface OrderCardProps {
  order: {
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
  };
}

export function OrderCard({ order }: OrderCardProps) {
  const itemsSummary = order.items.slice(0, 3).map(
    (i) => `${i.quantity}x ${i.menuItem.name}`
  );
  const moreCount = order.items.length - 3;

  return (
    <Link href={`/orders/${order.id}`}>
      <Card className="hover:shadow-md transition-shadow cursor-pointer">
        <CardContent className="pt-4 pb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="font-bold text-sm">{order.orderNumber}</span>
            <OrderStatusBadge status={order.status} />
          </div>
          <div className="flex items-center gap-3 text-xs text-muted-foreground mb-2">
            <span>Table {order.table.number}</span>
            <span className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              {order.guestCount}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {formatRelativeDate(order.createdAt)}
            </span>
          </div>
          <div className="text-xs text-muted-foreground space-y-0.5">
            {itemsSummary.map((item, i) => (
              <div key={i}>{item}</div>
            ))}
            {moreCount > 0 && (
              <div className="text-muted-foreground/70">
                +{moreCount} more items
              </div>
            )}
          </div>
          <div className="mt-2 pt-2 border-t flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              {order.server.name}
            </span>
            <span className="text-sm font-semibold">
              ${order.total.toFixed(2)}
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

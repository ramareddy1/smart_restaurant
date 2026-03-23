"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Send,
  Plus,
  X,
  Loader2,
  ArrowLeft,
  Users,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useOrder, useOrderBill } from "@/hooks/use-orders";
import {
  OrderStatusBadge,
  OrderItemStatusBadge,
} from "@/components/orders/order-status-badge";
import { BillSummary } from "@/components/orders/bill-summary";
import { PaymentForm } from "@/components/orders/payment-form";
import { formatCurrency, formatDateTime } from "@/lib/format";
import Link from "next/link";

export default function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { order, isLoading, mutate } = useOrder(id);
  const { bill, mutate: mutateBill } = useOrderBill(id);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Order not found
      </div>
    );
  }

  const hasPendingItems = order.items.some(
    (i: { status: string }) => i.status === "PENDING"
  );
  const isActive = !["CLOSED", "CANCELLED"].includes(order.status);

  async function handleAction(action: string) {
    setActionLoading(action);
    try {
      await fetch(`/api/orders/${id}/${action}`, { method: "PUT" });
      mutate();
      mutateBill();
    } catch {
      alert(`Failed to ${action} order`);
    } finally {
      setActionLoading(null);
    }
  }

  async function handleItemStatus(itemId: string, status: string) {
    try {
      await fetch(`/api/order-items/${itemId}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      mutate();
    } catch {
      alert("Failed to update item");
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <Link href="/orders">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <h1 className="text-2xl font-bold">{order.orderNumber}</h1>
            <OrderStatusBadge status={order.status} />
          </div>
          <div className="flex items-center gap-4 text-sm text-muted-foreground ml-10">
            <span>Table {order.table.number}</span>
            <span className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              {order.guestCount} guests
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {formatDateTime(order.createdAt)}
            </span>
            <span>Server: {order.server.name}</span>
          </div>
        </div>
        <div className="flex gap-2">
          {isActive && hasPendingItems && (
            <Button
              onClick={() => handleAction("send-to-kitchen")}
              disabled={!!actionLoading}
            >
              <Send className="h-4 w-4 mr-2" />
              {actionLoading === "send-to-kitchen"
                ? "Sending..."
                : "Send to Kitchen"}
            </Button>
          )}
          {isActive && (
            <>
              <Button
                variant="outline"
                onClick={() => router.push(`/orders/new?tableId=${order.tableId}`)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Items
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => handleAction("cancel")}
                disabled={!!actionLoading}
              >
                <X className="h-4 w-4 mr-1" />
                Cancel
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Order Items */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Order Items ({order.items.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {order.items.map(
                (item: {
                  id: string;
                  quantity: number;
                  unitPrice: number;
                  specialInstructions: string | null;
                  status: string;
                  menuItem: { name: string };
                }) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">
                          {item.quantity}x {item.menuItem.name}
                        </span>
                        <OrderItemStatusBadge status={item.status} />
                      </div>
                      {item.specialInstructions && (
                        <p className="text-xs text-red-600 mt-1">
                          {item.specialInstructions}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">
                        {formatCurrency(item.unitPrice * item.quantity)}
                      </span>
                      {isActive && item.status === "READY" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleItemStatus(item.id, "SERVED")}
                        >
                          Serve
                        </Button>
                      )}
                    </div>
                  </div>
                )
              )}
            </CardContent>
          </Card>

          {/* Notes */}
          {order.notes && (
            <Card className="mt-4">
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="outline">Notes</Badge>
                </div>
                <p className="text-sm text-muted-foreground">{order.notes}</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar: Bill + Payment */}
        <div className="space-y-4">
          {bill && <BillSummary bill={bill} />}

          {isActive && bill && !bill.isFullyPaid && (
            <PaymentForm
              orderId={id}
              remainingAmount={bill.remaining}
              onPaymentAdded={() => {
                mutate();
                mutateBill();
              }}
            />
          )}

          {isActive && bill?.isFullyPaid && (
            <Button
              className="w-full"
              onClick={() => handleAction("close")}
              disabled={!!actionLoading}
            >
              {actionLoading === "close" ? "Closing..." : "Close Order"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

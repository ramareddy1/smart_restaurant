"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { format } from "date-fns";
import {
  ArrowLeft,
  Send,
  XCircle,
  Package,
  Loader2,
  CheckCircle2,
  Truck,
} from "lucide-react";

import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { usePurchaseOrder } from "@/hooks/use-kitchen";

const STATUS_BADGE: Record<string, { label: string; className: string }> = {
  DRAFT: { label: "Draft", className: "bg-gray-100 text-gray-700" },
  SUBMITTED: { label: "Submitted", className: "bg-blue-100 text-blue-700" },
  PARTIALLY_RECEIVED: { label: "Partially Received", className: "bg-amber-100 text-amber-700" },
  RECEIVED: { label: "Received", className: "bg-green-100 text-green-700" },
  CANCELLED: { label: "Cancelled", className: "bg-red-100 text-red-700" },
};

const fmt = (n: number | null | undefined) =>
  n != null ? new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n) : "—";

export default function PurchaseOrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { order: po, isLoading, mutate } = usePurchaseOrder(id);
  const [showReceiving, setShowReceiving] = useState(false);
  const [receivingItems, setReceivingItems] = useState<
    Array<{ ingredientId: string; quantityReceived: number; unitCost: number; qualityNotes: string }>
  >([]);
  const [receivingNotes, setReceivingNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!po) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Purchase order not found</p>
        <Button asChild className="mt-4">
          <Link href="/purchase-orders">Back to Purchase Orders</Link>
        </Button>
      </div>
    );
  }

  const statusBadge = STATUS_BADGE[po.status] ?? { label: po.status, className: "" };
  const canReceive = ["SUBMITTED", "PARTIALLY_RECEIVED"].includes(po.status);
  const canSubmit = po.status === "DRAFT";
  const canCancel = !["RECEIVED", "CANCELLED"].includes(po.status);

  function initReceivingForm() {
    setReceivingItems(
      po.items.map((item: { ingredientId: string; quantityOrdered: number; quantityReceived: number; unitCost: number }) => ({
        ingredientId: item.ingredientId,
        quantityReceived: Math.max(0, item.quantityOrdered - item.quantityReceived),
        unitCost: item.unitCost,
        qualityNotes: "",
      }))
    );
    setReceivingNotes("");
    setShowReceiving(true);
  }

  async function handleAction(action: "submit" | "cancel") {
    try {
      const res = await fetch(`/api/purchase-orders/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error);
      }
      toast.success(action === "submit" ? "Purchase order submitted" : "Purchase order cancelled");
      mutate();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : `Failed to ${action}`);
    }
  }

  async function handleReceive(e: React.FormEvent) {
    e.preventDefault();
    const validItems = receivingItems.filter((i) => i.quantityReceived > 0);
    if (validItems.length === 0) {
      toast.error("Enter at least one item quantity");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/purchase-orders/${id}/receive`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: receivingNotes || null, items: validItems }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error);
      }
      toast.success("Goods received and stock updated");
      setShowReceiving(false);
      mutate();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to record receiving");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/purchase-orders"><ArrowLeft className="h-4 w-4" /></Link>
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">{po.orderNumber}</h1>
              <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusBadge.className}`}>
                {statusBadge.label}
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              {po.supplier.name} &middot; Created {format(new Date(po.createdAt), "MMM d, yyyy")}
              {po.createdBy && ` by ${po.createdBy.name}`}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {canSubmit && (
            <ConfirmDialog
              title="Submit this purchase order?"
              description="It can no longer be edited after submission."
              onConfirm={() => handleAction("submit")}
            >
              <Button><Send className="mr-2 h-4 w-4" /> Submit</Button>
            </ConfirmDialog>
          )}
          {canReceive && (
            <Button variant="default" onClick={initReceivingForm}>
              <Package className="mr-2 h-4 w-4" /> Receive Goods
            </Button>
          )}
          {canCancel && (
            <ConfirmDialog
              title="Cancel this purchase order?"
              description="This action cannot be undone."
              onConfirm={() => handleAction("cancel")}
            >
              <Button variant="destructive"><XCircle className="mr-2 h-4 w-4" /> Cancel</Button>
            </ConfirmDialog>
          )}
        </div>
      </div>

      {/* Order info */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Total Cost</p>
            <p className="text-2xl font-bold">{fmt(po.totalCost)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Expected Delivery</p>
            <p className="text-2xl font-bold">
              {po.expectedDate ? format(new Date(po.expectedDate), "MMM d, yyyy") : "Not set"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Receivings</p>
            <p className="text-2xl font-bold">{po.receivings?.length ?? 0}</p>
          </CardContent>
        </Card>
      </div>

      {po.notes && (
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground mb-1">Notes</p>
            <p className="text-sm">{po.notes}</p>
          </CardContent>
        </Card>
      )}

      {/* Line Items */}
      <Card>
        <CardHeader><CardTitle>Line Items</CardTitle></CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ingredient</TableHead>
                  <TableHead>Unit</TableHead>
                  <TableHead className="text-right">Ordered</TableHead>
                  <TableHead className="text-right">Received</TableHead>
                  <TableHead className="text-right">Unit Cost</TableHead>
                  <TableHead className="text-right">Line Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {po.items.map((item: {
                  id: string;
                  ingredient: { name: string; unit: string };
                  quantityOrdered: number;
                  quantityReceived: number;
                  unitCost: number;
                }) => {
                  const fulfilled = item.quantityReceived >= item.quantityOrdered;
                  return (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">
                        {item.ingredient.name}
                        {fulfilled && <CheckCircle2 className="inline ml-2 h-4 w-4 text-green-600" />}
                      </TableCell>
                      <TableCell className="text-muted-foreground">{item.ingredient.unit}</TableCell>
                      <TableCell className="text-right">{item.quantityOrdered}</TableCell>
                      <TableCell className="text-right">
                        <span className={fulfilled ? "text-green-600 font-medium" : item.quantityReceived > 0 ? "text-amber-600" : ""}>
                          {item.quantityReceived}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">{fmt(item.unitCost)}</TableCell>
                      <TableCell className="text-right font-medium">
                        {fmt(item.quantityOrdered * item.unitCost)}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Receiving Form */}
      {showReceiving && (
        <Card className="border-blue-200 bg-blue-50/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Truck className="h-5 w-5" /> Record Receiving
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleReceive} className="space-y-4">
              <div className="rounded-md border bg-background">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Ingredient</TableHead>
                      <TableHead className="w-[130px]">Qty Received</TableHead>
                      <TableHead className="w-[130px]">Unit Cost</TableHead>
                      <TableHead>Quality Notes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {po.items.map((item: {
                      ingredientId: string;
                      ingredient: { name: string; unit: string };
                      quantityOrdered: number;
                      quantityReceived: number;
                    }, index: number) => {
                      const remaining = Math.max(0, item.quantityOrdered - item.quantityReceived);
                      const ri = receivingItems[index];
                      if (!ri) return null;
                      return (
                        <TableRow key={item.ingredientId}>
                          <TableCell>
                            <span className="font-medium">{item.ingredient.name}</span>
                            <span className="text-xs text-muted-foreground ml-2">
                              ({remaining} {item.ingredient.unit} remaining)
                            </span>
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              value={ri.quantityReceived}
                              onChange={(e) => {
                                const updated = [...receivingItems];
                                updated[index] = { ...updated[index], quantityReceived: parseFloat(e.target.value) || 0 };
                                setReceivingItems(updated);
                              }}
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              value={ri.unitCost}
                              onChange={(e) => {
                                const updated = [...receivingItems];
                                updated[index] = { ...updated[index], unitCost: parseFloat(e.target.value) || 0 };
                                setReceivingItems(updated);
                              }}
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              placeholder="Optional notes..."
                              value={ri.qualityNotes}
                              onChange={(e) => {
                                const updated = [...receivingItems];
                                updated[index] = { ...updated[index], qualityNotes: e.target.value };
                                setReceivingItems(updated);
                              }}
                            />
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
              <Textarea
                placeholder="Receiving notes (optional)..."
                value={receivingNotes}
                onChange={(e) => setReceivingNotes(e.target.value)}
                rows={2}
              />
              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={() => setShowReceiving(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Confirm Receiving
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Receiving History */}
      {po.receivings?.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Receiving History</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {po.receivings.map((rec: {
              id: string;
              receivedAt: string;
              receivedBy: { name: string };
              notes: string | null;
              items: Array<{
                id: string;
                ingredient: { name: string; unit: string };
                quantityReceived: number;
                unitCost: number;
                qualityNotes: string | null;
              }>;
            }) => (
              <div key={rec.id} className="rounded-lg border p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="font-medium">
                    {format(new Date(rec.receivedAt), "MMM d, yyyy 'at' h:mm a")}
                  </p>
                  <Badge variant="outline">{rec.receivedBy.name}</Badge>
                </div>
                {rec.notes && <p className="text-sm text-muted-foreground mb-2">{rec.notes}</p>}
                <div className="text-sm space-y-1">
                  {rec.items.map((item) => (
                    <div key={item.id} className="flex justify-between">
                      <span>{item.ingredient.name}</span>
                      <span className="text-muted-foreground">
                        {item.quantityReceived} {item.ingredient.unit} @ {fmt(item.unitCost)}
                        {item.qualityNotes && ` — ${item.qualityNotes}`}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

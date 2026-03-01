"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { ArrowLeft, Plus, Trash2, Loader2, Sparkles } from "lucide-react";

import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useSuppliers } from "@/hooks/use-suppliers";
import { useLowStockIngredients } from "@/hooks/use-kitchen";
import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface LineItem {
  ingredientId: string;
  ingredientName: string;
  unit: string;
  quantityOrdered: number;
  unitCost: number;
}

export default function NewPurchaseOrderPage() {
  const router = useRouter();
  const [supplierId, setSupplierId] = useState("");
  const [expectedDate, setExpectedDate] = useState("");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<LineItem[]>([]);
  const [loading, setLoading] = useState(false);

  const { suppliers } = useSuppliers();
  const { ingredients: lowStock } = useLowStockIngredients(supplierId || undefined);

  // Get all ingredients for the selected supplier
  const { data: ingredientData } = useSWR(
    supplierId ? `/api/ingredients?supplierId=${supplierId}&pageSize=200` : null,
    fetcher
  );
  const availableIngredients = ingredientData?.items ?? [];

  function handleAutoPopulate() {
    if (!lowStock.length) {
      toast.info("No low-stock ingredients for this supplier");
      return;
    }

    const newItems: LineItem[] = lowStock.map((i: {
      id: string;
      name: string;
      unit: string;
      suggestedOrder: number;
      costPerUnit: number;
    }) => ({
      ingredientId: i.id,
      ingredientName: i.name,
      unit: i.unit,
      quantityOrdered: i.suggestedOrder,
      unitCost: i.costPerUnit,
    }));

    setItems(newItems);
    toast.success(`Auto-populated ${newItems.length} low-stock items`);
  }

  function addEmptyLine() {
    setItems([
      ...items,
      { ingredientId: "", ingredientName: "", unit: "", quantityOrdered: 0, unitCost: 0 },
    ]);
  }

  function updateLine(index: number, field: keyof LineItem, value: string | number) {
    const updated = [...items];
    if (field === "ingredientId") {
      const ing = availableIngredients.find((i: { id: string }) => i.id === value);
      if (ing) {
        updated[index] = {
          ...updated[index],
          ingredientId: ing.id,
          ingredientName: ing.name,
          unit: ing.unit,
          unitCost: ing.costPerUnit,
        };
      }
    } else {
      (updated[index] as unknown as Record<string, unknown>)[field] = value;
    }
    setItems(updated);
  }

  function removeLine(index: number) {
    setItems(items.filter((_, i) => i !== index));
  }

  const totalCost = items.reduce((sum, i) => sum + i.quantityOrdered * i.unitCost, 0);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!supplierId) {
      toast.error("Please select a supplier");
      return;
    }
    if (items.length === 0 || items.some((i) => !i.ingredientId)) {
      toast.error("Please add at least one valid line item");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/purchase-orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          supplierId,
          expectedDate: expectedDate || null,
          notes: notes || null,
          items: items.map((i) => ({
            ingredientId: i.ingredientId,
            quantityOrdered: i.quantityOrdered,
            unitCost: i.unitCost,
          })),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create PO");
      }

      const po = await res.json();
      toast.success(`Purchase order ${po.orderNumber} created`);
      router.push("/purchase-orders");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create purchase order");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/purchase-orders">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <PageHeader
          title="New Purchase Order"
          description="Create a new purchase order for your suppliers"
        />
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* PO Header */}
        <Card>
          <CardHeader>
            <CardTitle>Order Details</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Supplier *</Label>
              <Select value={supplierId} onValueChange={setSupplierId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a supplier" />
                </SelectTrigger>
                <SelectContent>
                  {suppliers.map((s: { id: string; name: string }) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Expected Delivery Date</Label>
              <Input
                type="date"
                value={expectedDate}
                onChange={(e) => setExpectedDate(e.target.value)}
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label>Notes</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any special instructions..."
                rows={2}
              />
            </div>
          </CardContent>
        </Card>

        {/* Line Items */}
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle>Line Items</CardTitle>
            <div className="flex gap-2">
              {supplierId && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAutoPopulate}
                >
                  <Sparkles className="mr-2 h-4 w-4" />
                  Auto-fill Low Stock ({lowStock.length})
                </Button>
              )}
              <Button type="button" variant="outline" size="sm" onClick={addEmptyLine}>
                <Plus className="mr-2 h-4 w-4" /> Add Line
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {items.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No items added yet. Select a supplier then click &quot;Auto-fill Low Stock&quot; or add items manually.
              </p>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[300px]">Ingredient</TableHead>
                      <TableHead>Unit</TableHead>
                      <TableHead className="w-[120px]">Quantity</TableHead>
                      <TableHead className="w-[120px]">Unit Cost</TableHead>
                      <TableHead className="text-right">Line Total</TableHead>
                      <TableHead className="w-[50px]" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          {item.ingredientName ? (
                            <span className="font-medium">{item.ingredientName}</span>
                          ) : (
                            <Select
                              value={item.ingredientId}
                              onValueChange={(val) => updateLine(index, "ingredientId", val)}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select ingredient" />
                              </SelectTrigger>
                              <SelectContent>
                                {availableIngredients.map((i: { id: string; name: string }) => (
                                  <SelectItem key={i.id} value={i.id}>
                                    {i.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                        </TableCell>
                        <TableCell className="text-muted-foreground">{item.unit}</TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.quantityOrdered}
                            onChange={(e) =>
                              updateLine(index, "quantityOrdered", parseFloat(e.target.value) || 0)
                            }
                            className="w-24"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.unitCost}
                            onChange={(e) =>
                              updateLine(index, "unitCost", parseFloat(e.target.value) || 0)
                            }
                            className="w-24"
                          />
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          ${(item.quantityOrdered * item.unitCost).toFixed(2)}
                        </TableCell>
                        <TableCell>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeLine(index)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            {items.length > 0 && (
              <div className="mt-4 flex justify-end">
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Estimated Total</p>
                  <p className="text-2xl font-bold">${totalCost.toFixed(2)}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Submit */}
        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" asChild>
            <Link href="/purchase-orders">Cancel</Link>
          </Button>
          <Button type="submit" disabled={loading || !supplierId || items.length === 0}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create Purchase Order
          </Button>
        </div>
      </form>
    </div>
  );
}

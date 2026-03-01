"use client";

import { useState } from "react";
import { toast } from "sonner";
import { format } from "date-fns";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { Plus, Loader2, Trash2, TrendingDown, DollarSign, AlertTriangle } from "lucide-react";

import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
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
import { Skeleton } from "@/components/ui/skeleton";
import { useWasteData } from "@/hooks/use-kitchen";
import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

const WASTE_REASONS = [
  { value: "EXPIRED", label: "Expired" },
  { value: "SPOILED", label: "Spoiled" },
  { value: "OVERPRODUCTION", label: "Overproduction" },
  { value: "DROPPED", label: "Dropped" },
  { value: "QUALITY_ISSUE", label: "Quality Issue" },
  { value: "OTHER", label: "Other" },
];

const REASON_COLORS: Record<string, string> = {
  EXPIRED: "#ef4444",
  SPOILED: "#f97316",
  OVERPRODUCTION: "#eab308",
  DROPPED: "#8b5cf6",
  QUALITY_ISSUE: "#3b82f6",
  OTHER: "#6b7280",
  UNSPECIFIED: "#d1d5db",
};

const PIE_COLORS = ["#ef4444", "#f97316", "#eab308", "#8b5cf6", "#3b82f6", "#6b7280", "#d1d5db"];

const fmt = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);

export default function WasteLogPage() {
  const [days, setDays] = useState(30);
  const { items, stats, isLoading, mutate } = useWasteData(days);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Daily chart data
  const dailyChartData = stats?.byDay
    ? Object.entries(stats.byDay as Record<string, number>)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, cost]) => ({
          date: format(new Date(date), "MMM d"),
          cost: Math.round(cost * 100) / 100,
        }))
    : [];

  // Reason pie chart data
  const reasonChartData = stats?.byReason
    ? Object.entries(stats.byReason as Record<string, { count: number; cost: number }>).map(
        ([reason, data]) => ({
          name: WASTE_REASONS.find((r) => r.value === reason)?.label ?? reason,
          value: Math.round(data.cost * 100) / 100,
          count: data.count,
        })
      )
    : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader
          title="Waste Log"
          description="Track and analyze food waste to reduce costs"
        />
        <div className="flex gap-2 items-center">
          <Select value={String(days)} onValueChange={(v) => setDays(Number(v))}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="14">Last 14 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="mr-2 h-4 w-4" /> Record Waste</Button>
            </DialogTrigger>
            <RecordWasteDialog
              onSuccess={() => {
                setDialogOpen(false);
                mutate();
              }}
            />
          </Dialog>
        </div>
      </div>

      {/* Summary Cards */}
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-24" />)}
        </div>
      ) : stats ? (
        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <CardContent className="flex items-center gap-4 pt-6">
              <div className="rounded-full bg-red-100 p-3">
                <DollarSign className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Waste Cost</p>
                <p className="text-2xl font-bold">{fmt(stats.totalWasteCost)}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4 pt-6">
              <div className="rounded-full bg-amber-100 p-3">
                <Trash2 className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Waste Events</p>
                <p className="text-2xl font-bold">{stats.totalCount}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4 pt-6">
              <div className="rounded-full bg-orange-100 p-3">
                <AlertTriangle className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Top Wasted</p>
                <p className="text-2xl font-bold">
                  {stats.topWasted?.[0]?.name ?? "None"}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : null}

      {/* Charts */}
      {!isLoading && stats && (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader><CardTitle>Daily Waste Cost</CardTitle></CardHeader>
            <CardContent>
              {dailyChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={dailyChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" fontSize={12} />
                    <YAxis fontSize={12} tickFormatter={(v) => `$${v}`} />
                    <Tooltip formatter={(v: number) => [`$${v.toFixed(2)}`, "Cost"]} />
                    <Bar dataKey="cost" fill="#ef4444" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-12">No waste data</p>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Waste by Reason</CardTitle></CardHeader>
            <CardContent>
              {reasonChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={reasonChartData}
                      cx="50%"
                      cy="50%"
                      outerRadius={90}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {reasonChartData.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v: number) => [`$${v.toFixed(2)}`, "Cost"]} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-12">No waste data</p>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Top Wasted Ingredients */}
      {!isLoading && stats?.topWasted?.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Top Wasted Ingredients</CardTitle></CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ingredient</TableHead>
                    <TableHead className="text-right">Events</TableHead>
                    <TableHead className="text-right">Total Cost</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stats.topWasted.map((item: { ingredientId: string; name: string; count: number; cost: number }) => (
                    <TableRow key={item.ingredientId}>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell className="text-right">{item.count}</TableCell>
                      <TableCell className="text-right font-medium text-red-600">{fmt(item.cost)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Waste Transactions */}
      {!isLoading && (
        <Card>
          <CardHeader><CardTitle>Recent Waste Entries</CardTitle></CardHeader>
          <CardContent>
            {items.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No waste recorded</p>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Ingredient</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead className="text-right">Qty</TableHead>
                      <TableHead className="text-right">Cost</TableHead>
                      <TableHead>Notes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.slice(0, 50).map((t: {
                      id: string;
                      createdAt: string;
                      ingredient: { name: string; unit: string; costPerUnit: number };
                      wasteReason: string | null;
                      quantity: number;
                      totalCost: number | null;
                      notes: string | null;
                    }) => (
                      <TableRow key={t.id}>
                        <TableCell className="text-sm">{format(new Date(t.createdAt), "MMM d")}</TableCell>
                        <TableCell className="font-medium">{t.ingredient.name}</TableCell>
                        <TableCell>
                          {t.wasteReason ? (
                            <Badge variant="outline" style={{ borderColor: REASON_COLORS[t.wasteReason] }}>
                              {WASTE_REASONS.find((r) => r.value === t.wasteReason)?.label ?? t.wasteReason}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {t.quantity} {t.ingredient.unit}
                        </TableCell>
                        <TableCell className="text-right text-red-600 font-medium">
                          {fmt(t.totalCost ?? t.quantity * t.ingredient.costPerUnit)}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">
                          {t.notes ?? "—"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ─── Record Waste Dialog ──────────────────────────────────────

function RecordWasteDialog({ onSuccess }: { onSuccess: () => void }) {
  const [ingredientId, setIngredientId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const { data } = useSWR("/api/ingredients?pageSize=200", fetcher);
  const ingredients = data?.items ?? [];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!ingredientId || !quantity) {
      setError("Ingredient and quantity are required");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/kitchen/waste", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ingredientId,
          quantity: parseFloat(quantity),
          wasteReason: reason || null,
          notes: notes || null,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error);
      }
      toast.success("Waste recorded");
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to record waste");
    } finally {
      setLoading(false);
    }
  }

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Record Waste</DialogTitle>
      </DialogHeader>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label>Ingredient *</Label>
          <Select value={ingredientId} onValueChange={setIngredientId}>
            <SelectTrigger><SelectValue placeholder="Select ingredient" /></SelectTrigger>
            <SelectContent>
              {ingredients.map((i: { id: string; name: string; unit: string }) => (
                <SelectItem key={i.id} value={i.id}>{i.name} ({i.unit})</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Quantity *</Label>
          <Input type="number" min="0" step="0.01" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Reason</Label>
          <Select value={reason} onValueChange={setReason}>
            <SelectTrigger><SelectValue placeholder="Select reason (optional)" /></SelectTrigger>
            <SelectContent>
              {WASTE_REASONS.map((r) => (
                <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Notes</Label>
          <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional notes..." rows={2} />
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <DialogFooter>
          <Button type="submit" disabled={loading || !ingredientId || !quantity}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Record Waste
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}

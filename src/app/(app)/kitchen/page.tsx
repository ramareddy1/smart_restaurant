"use client";

import Link from "next/link";
import { format } from "date-fns";
import {
  Package,
  AlertTriangle,
  Clock,
  DollarSign,
  ClipboardList,
  Trash2,
  ArrowRight,
  TrendingDown,
  Truck,
} from "lucide-react";

import { PageHeader } from "@/components/shared/page-header";
import { AIAnalysisCard } from "@/components/shared/ai-analysis-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useKitchenDashboard, useUsageVelocity } from "@/hooks/use-kitchen";
import { formatCurrency, formatRelativeDate } from "@/lib/format";

const poStatusColors: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-800",
  SUBMITTED: "bg-blue-100 text-blue-800",
  PARTIALLY_RECEIVED: "bg-yellow-100 text-yellow-800",
  RECEIVED: "bg-green-100 text-green-800",
  CANCELLED: "bg-red-100 text-red-800",
};

export default function KitchenDashboardPage() {
  const { data, isLoading } = useKitchenDashboard();
  const { items: velocityItems, isLoading: loadingVelocity } =
    useUsageVelocity(30);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Kitchen Dashboard"
          description="Inventory, purchasing, and waste at a glance"
        />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-72" />
          <Skeleton className="h-72" />
        </div>
      </div>
    );
  }

  const {
    lowStockCount = 0,
    pendingPOs = 0,
    todayWaste = { cost: 0, count: 0 },
    weekWaste = { cost: 0, count: 0 },
    expiringCount = 0,
    recentReceivings = [],
    poStats = {},
  } = data ?? {};

  // Top items running low on stock (from velocity data)
  const criticalItems = velocityItems
    .filter(
      (item: { daysOfStockLeft: number | null; currentStock: number; parLevel: number }) =>
        item.daysOfStockLeft !== null && item.daysOfStockLeft < 7 && item.currentStock < item.parLevel
    )
    .slice(0, 5);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Kitchen Dashboard"
        description="Inventory, purchasing, and waste at a glance"
      />

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="rounded-full bg-yellow-100 p-3">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Low Stock Items</p>
              <p className={`text-2xl font-bold ${lowStockCount > 0 ? "text-yellow-600" : ""}`}>
                {lowStockCount}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="rounded-full bg-blue-100 p-3">
              <ClipboardList className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Pending POs</p>
              <p className="text-2xl font-bold">{pendingPOs}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="rounded-full bg-red-100 p-3">
              <Trash2 className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Today&apos;s Waste</p>
              <p className={`text-2xl font-bold ${todayWaste.cost > 0 ? "text-red-600" : ""}`}>
                {formatCurrency(todayWaste.cost)}
              </p>
              <p className="text-xs text-muted-foreground">{todayWaste.count} events</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="rounded-full bg-orange-100 p-3">
              <Clock className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Expiring Soon</p>
              <p className={`text-2xl font-bold ${expiringCount > 0 ? "text-orange-600" : ""}`}>
                {expiringCount}
              </p>
              <p className="text-xs text-muted-foreground">within 3 days</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Second row: Week waste + PO status breakdown */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base">Week Waste Summary</CardTitle>
            <Button asChild variant="ghost" size="sm">
              <Link href="/waste">
                View Log <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-8">
              <div>
                <p className="text-3xl font-bold text-red-600">
                  {formatCurrency(weekWaste.cost)}
                </p>
                <p className="text-sm text-muted-foreground">
                  {weekWaste.count} waste events this week
                </p>
              </div>
              {todayWaste.cost > 0 && weekWaste.cost > 0 && (
                <div className="rounded-lg bg-muted p-3">
                  <p className="text-xs text-muted-foreground">Today&apos;s Share</p>
                  <p className="text-lg font-semibold">
                    {Math.round((todayWaste.cost / weekWaste.cost) * 100)}%
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base">PO Status Breakdown</CardTitle>
            <Button asChild variant="ghost" size="sm">
              <Link href="/purchase-orders">
                All POs <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              {Object.entries(poStats).map(([status, count]) => (
                <div key={status} className="flex items-center gap-2">
                  <Badge
                    variant="secondary"
                    className={poStatusColors[status] ?? ""}
                  >
                    {status.replace(/_/g, " ")}
                  </Badge>
                  <span className="text-lg font-semibold">{count as number}</span>
                </div>
              ))}
              {Object.keys(poStats).length === 0 && (
                <p className="text-sm text-muted-foreground">No purchase orders yet</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Third row: Critical stock items + Recent receivings */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Critical Stock */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-red-500" />
              Critical Stock Levels
            </CardTitle>
            <Button asChild variant="ghost" size="sm">
              <Link href="/inventory">
                Inventory <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {loadingVelocity ? (
              <Skeleton className="h-40" />
            ) : criticalItems.length > 0 ? (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Ingredient</TableHead>
                      <TableHead className="text-right">Stock</TableHead>
                      <TableHead className="text-right">Par</TableHead>
                      <TableHead className="text-right">Days Left</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {criticalItems.map(
                      (item: {
                        ingredientId: string;
                        name: string;
                        currentStock: number;
                        parLevel: number;
                        unit: string;
                        daysOfStockLeft: number | null;
                      }) => (
                        <TableRow key={item.ingredientId}>
                          <TableCell className="font-medium">{item.name}</TableCell>
                          <TableCell className="text-right">
                            {item.currentStock} {item.unit}
                          </TableCell>
                          <TableCell className="text-right">
                            {item.parLevel} {item.unit}
                          </TableCell>
                          <TableCell className="text-right">
                            <Badge
                              variant={
                                (item.daysOfStockLeft ?? 0) < 3
                                  ? "destructive"
                                  : "secondary"
                              }
                            >
                              {item.daysOfStockLeft?.toFixed(1) ?? "—"} days
                            </Badge>
                          </TableCell>
                        </TableRow>
                      )
                    )}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
                All items above critical levels
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Receivings */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Truck className="h-4 w-4 text-green-500" />
              Recent Receivings
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentReceivings.length > 0 ? (
              <div className="space-y-3">
                {recentReceivings.map(
                  (r: {
                    id: string;
                    receivedAt: string;
                    purchaseOrder: {
                      orderNumber: string;
                      supplier: { name: string };
                    };
                    receivedBy: { name: string } | null;
                    _count: { items: number };
                  }) => (
                    <div
                      key={r.id}
                      className="flex items-center justify-between rounded-lg border p-3"
                    >
                      <div>
                        <p className="text-sm font-medium">
                          {r.purchaseOrder.orderNumber}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {r.purchaseOrder.supplier.name} &middot;{" "}
                          {r._count.items} item{r._count.items !== 1 ? "s" : ""}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">
                          {formatRelativeDate(r.receivedAt)}
                        </p>
                        {r.receivedBy && (
                          <p className="text-xs text-muted-foreground">
                            by {r.receivedBy.name}
                          </p>
                        )}
                      </div>
                    </div>
                  )
                )}
              </div>
            ) : (
              <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
                No receivings yet
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* AI Features */}
      <div className="grid gap-4 md:grid-cols-2">
        <AIAnalysisCard
          title="Smart Reorder Suggestions"
          description="AI analyzes your usage velocity, current stock levels, and pending orders to recommend what to reorder and how much."
          endpoint="/api/ai/reorder-suggestions"
        />
        <AIAnalysisCard
          title="Waste Pattern Analysis"
          description="AI analyzes your waste logs with reason codes to identify patterns and suggest concrete steps to reduce food waste."
          endpoint="/api/ai/waste-analysis"
        />
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button asChild>
              <Link href="/purchase-orders/new">
                <ClipboardList className="mr-2 h-4 w-4" />
                New Purchase Order
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/waste">
                <Trash2 className="mr-2 h-4 w-4" />
                Record Waste
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/supplier-performance">
                <Truck className="mr-2 h-4 w-4" />
                Supplier Performance
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/inventory">
                <Package className="mr-2 h-4 w-4" />
                View Inventory
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

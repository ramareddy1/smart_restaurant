"use client";

import Link from "next/link";
import {
  Package,
  AlertTriangle,
  Clock,
  DollarSign,
  Bell,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useDashboard } from "@/hooks/use-dashboard";
import { formatCurrency, formatRelativeDate } from "@/lib/format";

const typeColors: Record<string, string> = {
  PURCHASE: "bg-green-100 text-green-800",
  USAGE: "bg-blue-100 text-blue-800",
  WASTE: "bg-red-100 text-red-800",
  ADJUSTMENT: "bg-gray-100 text-gray-800",
};

export default function DashboardPage() {
  const { dashboard, isLoading } = useDashboard();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Overview of your restaurant operations
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-[120px]" />
          ))}
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-[380px]" />
          <Skeleton className="h-[380px]" />
        </div>
      </div>
    );
  }

  const stats = dashboard?.stats;
  const recentTx = dashboard?.recentTransactions ?? [];
  const stockLevels = dashboard?.stockLevels ?? [];
  const topExpenses = dashboard?.topExpenses ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Overview of your restaurant operations
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/alerts">
            <Bell className="mr-2 h-4 w-4" />
            Alerts
            {stats?.unreadAlerts > 0 && (
              <Badge variant="destructive" className="ml-2">
                {stats.unreadAlerts}
              </Badge>
            )}
          </Link>
        </Button>
      </div>

      {/* Stat Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Ingredients
            </CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.ingredientCount ?? 0}
            </div>
            <p className="text-xs text-muted-foreground">items in inventory</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock</CardTitle>
            <AlertTriangle
              className={`h-4 w-4 ${
                (stats?.lowStockCount ?? 0) > 0
                  ? "text-yellow-500"
                  : "text-muted-foreground"
              }`}
            />
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${
                (stats?.lowStockCount ?? 0) > 0 ? "text-yellow-600" : ""
              }`}
            >
              {stats?.lowStockCount ?? 0}
            </div>
            <p className="text-xs text-muted-foreground">
              items below par level
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Expiring Soon
            </CardTitle>
            <Clock
              className={`h-4 w-4 ${
                (stats?.expiringCount ?? 0) > 0
                  ? "text-orange-500"
                  : "text-muted-foreground"
              }`}
            />
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${
                (stats?.expiringCount ?? 0) > 0 ? "text-orange-600" : ""
              }`}
            >
              {stats?.expiringCount ?? 0}
            </div>
            <p className="text-xs text-muted-foreground">within 3 days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Inventory Value
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(stats?.totalInventoryValue ?? 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              total estimated value
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Stock Levels Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Stock Levels vs Par</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            {stockLevels.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stockLevels} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 11 }}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="currentStock" fill="#3b82f6" name="Current Stock" />
                  <Bar dataKey="parLevel" fill="#e5e7eb" name="Par Level" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-muted-foreground">
                No inventory data yet
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Expenses */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Top Spending (Last 30 Days)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {topExpenses.length > 0 ? (
              <div className="space-y-4">
                {topExpenses.map(
                  (
                    expense: {
                      ingredientId: string;
                      ingredientName: string;
                      totalSpent: number;
                    },
                    i: number
                  ) => (
                    <div key={expense.ingredientId} className="flex items-center">
                      <div className="w-8 text-sm text-muted-foreground">
                        #{i + 1}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">
                          {expense.ingredientName}
                        </p>
                        <div className="mt-1 h-2 w-full rounded-full bg-muted">
                          <div
                            className="h-2 rounded-full bg-primary"
                            style={{
                              width: `${
                                (expense.totalSpent /
                                  (topExpenses[0]?.totalSpent || 1)) *
                                100
                              }%`,
                            }}
                          />
                        </div>
                      </div>
                      <div className="ml-4 text-sm font-semibold">
                        {formatCurrency(expense.totalSpent)}
                      </div>
                    </div>
                  )
                )}
              </div>
            ) : (
              <div className="flex h-[250px] items-center justify-center text-muted-foreground">
                No purchase data yet
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Transactions */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Recent Transactions</CardTitle>
          <Button asChild variant="ghost" size="sm">
            <Link href="/transactions">
              View all <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {recentTx.length > 0 ? (
            <div className="space-y-3">
              {recentTx.slice(0, 5).map(
                (tx: {
                  id: string;
                  type: string;
                  quantity: number;
                  totalCost: number | null;
                  createdAt: string;
                  ingredient: { name: string; unit: string };
                  supplier: { name: string } | null;
                }) => (
                  <div
                    key={tx.id}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div className="flex items-center gap-3">
                      <Badge
                        variant="secondary"
                        className={typeColors[tx.type] ?? ""}
                      >
                        {tx.type}
                      </Badge>
                      <div>
                        <p className="text-sm font-medium">
                          {tx.ingredient.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {tx.quantity} {tx.ingredient.unit}
                          {tx.supplier && ` from ${tx.supplier.name}`}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      {tx.totalCost != null && (
                        <p className="text-sm font-medium">
                          {formatCurrency(tx.totalCost)}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        {formatRelativeDate(tx.createdAt)}
                      </p>
                    </div>
                  </div>
                )
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              No transactions yet
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

"use client";

import Link from "next/link";
import {
  ShoppingCart,
  Grid3X3,
  Monitor,
  Clock,
  DollarSign,
  TrendingUp,
  Utensils,
  Plus,
  ArrowRight,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useServerDashboard } from "@/hooks/use-server-dashboard";
import { useActiveOrders } from "@/hooks/use-orders";
import { OrderStatusBadge } from "@/components/orders/order-status-badge";
import { formatCurrency } from "@/lib/format";

export default function ServerDashboardPage() {
  const { dashboard, isLoading } = useServerDashboard();
  const { orders: activeOrders } = useActiveOrders();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const recentOrders = (activeOrders ?? []).slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Server Dashboard</h1>
          <p className="text-muted-foreground text-sm">
            Front-of-house overview
          </p>
        </div>
        <Link href="/orders/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Order
          </Button>
        </Link>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active Orders</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {dashboard?.activeOrders ?? 0}
            </div>
            {dashboard?.statusBreakdown && dashboard.statusBreakdown.length > 0 && (
              <div className="flex gap-1 mt-1 flex-wrap">
                {dashboard.statusBreakdown.map(
                  (s: { status: string; count: number }) => (
                    <Badge key={s.status} variant="outline" className="text-xs">
                      {s.status.replace(/_/g, " ")}: {s.count}
                    </Badge>
                  )
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Tables Occupied
            </CardTitle>
            <Grid3X3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {dashboard?.tablesOccupied ?? 0}{" "}
              <span className="text-sm font-normal text-muted-foreground">
                / {dashboard?.totalTables ?? 0}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {dashboard?.totalTables
                ? Math.round(
                    ((dashboard.tablesOccupied ?? 0) / dashboard.totalTables) *
                      100
                  )
                : 0}
              % occupancy
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Avg Order Time
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {dashboard?.avgOrderTimeMin ?? 0}{" "}
              <span className="text-sm font-normal text-muted-foreground">
                min
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {dashboard?.todayClosedOrders ?? 0} orders closed today
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Today&apos;s Revenue
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(dashboard?.todayRevenue ?? 0)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              From {dashboard?.todayClosedOrders ?? 0} closed orders
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Active Orders */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Active Orders</CardTitle>
            <Link href="/orders">
              <Button variant="ghost" size="sm">
                View All <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {recentOrders.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No active orders
              </p>
            ) : (
              <div className="space-y-2">
                {recentOrders.map(
                  (order: {
                    id: string;
                    orderNumber: string;
                    status: string;
                    table: { number: number };
                    items: Array<{ id: string }>;
                    total: number;
                  }) => (
                    <Link
                      key={order.id}
                      href={`/orders/${order.id}`}
                      className="flex items-center justify-between rounded-lg border p-3 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm">
                              {order.orderNumber}
                            </span>
                            <OrderStatusBadge status={order.status} />
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Table {order.table.number} &middot;{" "}
                            {order.items.length} items
                          </p>
                        </div>
                      </div>
                      <span className="text-sm font-medium">
                        {formatCurrency(order.total)}
                      </span>
                    </Link>
                  )
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Links */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            <Link href="/orders/new">
              <Button
                variant="outline"
                className="w-full justify-start h-auto py-3"
              >
                <Plus className="h-5 w-5 mr-3 text-blue-500" />
                <div className="text-left">
                  <div className="font-medium">New Order</div>
                  <div className="text-xs text-muted-foreground">
                    Take a new order
                  </div>
                </div>
              </Button>
            </Link>
            <Link href="/tables">
              <Button
                variant="outline"
                className="w-full justify-start h-auto py-3"
              >
                <Grid3X3 className="h-5 w-5 mr-3 text-green-500" />
                <div className="text-left">
                  <div className="font-medium">Tables</div>
                  <div className="text-xs text-muted-foreground">
                    Manage table status
                  </div>
                </div>
              </Button>
            </Link>
            <Link href="/kitchen-display">
              <Button
                variant="outline"
                className="w-full justify-start h-auto py-3"
              >
                <Monitor className="h-5 w-5 mr-3 text-orange-500" />
                <div className="text-left">
                  <div className="font-medium">Kitchen Display</div>
                  <div className="text-xs text-muted-foreground">
                    View kitchen orders
                  </div>
                </div>
              </Button>
            </Link>
            <Link href="/menus">
              <Button
                variant="outline"
                className="w-full justify-start h-auto py-3"
              >
                <Utensils className="h-5 w-5 mr-3 text-purple-500" />
                <div className="text-left">
                  <div className="font-medium">Menus</div>
                  <div className="text-xs text-muted-foreground">
                    Browse active menus
                  </div>
                </div>
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

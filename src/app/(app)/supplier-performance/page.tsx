"use client";

import { useState } from "react";
import { format } from "date-fns";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Truck, Clock, DollarSign, Star } from "lucide-react";

import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useSuppliers } from "@/hooks/use-suppliers";
import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

const fmt = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);

export default function SupplierPerformancePage() {
  const { suppliers, isLoading: loadingSuppliers } = useSuppliers();
  const { data: poData, isLoading: loadingPOs } = useSWR(
    "/api/purchase-orders?pageSize=200",
    fetcher
  );

  const orders = poData?.items ?? [];
  const isLoading = loadingSuppliers || loadingPOs;

  // Compute per-supplier stats
  const supplierStats = suppliers.map((sup: { id: string; name: string }) => {
    const supplierOrders = orders.filter(
      (o: { supplier: { id: string } }) => o.supplier.id === sup.id
    );
    const totalOrders = supplierOrders.length;
    const receivedOrders = supplierOrders.filter(
      (o: { status: string }) => o.status === "RECEIVED" || o.status === "PARTIALLY_RECEIVED"
    );
    const totalSpend = supplierOrders.reduce(
      (sum: number, o: { totalCost: number | null }) => sum + (o.totalCost ?? 0),
      0
    );

    // On-time delivery: orders where received before or on expectedDate
    let onTimeCount = 0;
    let lateCount = 0;
    for (const o of receivedOrders) {
      if (o.expectedDate) {
        // Find the latest receiving date
        const lastReceiving = o.receivings?.length
          ? o.receivings.sort(
              (a: { receivedAt: string }, b: { receivedAt: string }) =>
                new Date(b.receivedAt).getTime() - new Date(a.receivedAt).getTime()
            )[0]
          : null;
        if (lastReceiving) {
          const received = new Date(lastReceiving.receivedAt);
          const expected = new Date(o.expectedDate);
          if (received <= expected) onTimeCount++;
          else lateCount++;
        }
      }
    }
    const deliveryRatePercent =
      onTimeCount + lateCount > 0
        ? Math.round((onTimeCount / (onTimeCount + lateCount)) * 100)
        : null;

    return {
      id: sup.id,
      name: sup.name,
      totalOrders,
      receivedCount: receivedOrders.length,
      totalSpend: Math.round(totalSpend * 100) / 100,
      onTimeCount,
      lateCount,
      deliveryRatePercent,
    };
  });

  // Sort by total spend desc
  supplierStats.sort(
    (a: { totalSpend: number }, b: { totalSpend: number }) => b.totalSpend - a.totalSpend
  );

  // Chart: spend per supplier
  const chartData = supplierStats
    .filter((s: { totalSpend: number }) => s.totalSpend > 0)
    .map((s: { name: string; totalSpend: number }) => ({
      name: s.name.length > 15 ? s.name.slice(0, 15) + "..." : s.name,
      spend: s.totalSpend,
    }));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Supplier Performance"
        description="Track delivery reliability and spending by supplier"
      />

      {isLoading ? (
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-24" />)}
          </div>
          <Skeleton className="h-64" />
        </div>
      ) : (
        <>
          {/* Summary cards */}
          <div className="grid gap-4 sm:grid-cols-3">
            <Card>
              <CardContent className="flex items-center gap-4 pt-6">
                <div className="rounded-full bg-blue-100 p-3">
                  <Truck className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Active Suppliers</p>
                  <p className="text-2xl font-bold">
                    {supplierStats.filter((s: { totalOrders: number }) => s.totalOrders > 0).length}
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center gap-4 pt-6">
                <div className="rounded-full bg-green-100 p-3">
                  <DollarSign className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Spend</p>
                  <p className="text-2xl font-bold">
                    {fmt(supplierStats.reduce((s: number, x: { totalSpend: number }) => s + x.totalSpend, 0))}
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center gap-4 pt-6">
                <div className="rounded-full bg-purple-100 p-3">
                  <Clock className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total POs</p>
                  <p className="text-2xl font-bold">{orders.length}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Spend chart */}
          {chartData.length > 0 && (
            <Card>
              <CardHeader><CardTitle>Spend by Supplier</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={chartData} layout="vertical" margin={{ left: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" tickFormatter={(v) => `$${v}`} fontSize={12} />
                    <YAxis type="category" dataKey="name" width={120} fontSize={12} />
                    <Tooltip formatter={(v: number) => [`$${v.toFixed(2)}`, "Spend"]} />
                    <Bar dataKey="spend" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* Supplier table */}
          <Card>
            <CardHeader><CardTitle>Supplier Scorecard</CardTitle></CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Supplier</TableHead>
                      <TableHead className="text-right">Orders</TableHead>
                      <TableHead className="text-right">Received</TableHead>
                      <TableHead className="text-right">Total Spend</TableHead>
                      <TableHead className="text-right">On-Time %</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {supplierStats.map((s: {
                      id: string;
                      name: string;
                      totalOrders: number;
                      receivedCount: number;
                      totalSpend: number;
                      deliveryRatePercent: number | null;
                    }) => (
                      <TableRow key={s.id}>
                        <TableCell className="font-medium">{s.name}</TableCell>
                        <TableCell className="text-right">{s.totalOrders}</TableCell>
                        <TableCell className="text-right">{s.receivedCount}</TableCell>
                        <TableCell className="text-right">{fmt(s.totalSpend)}</TableCell>
                        <TableCell className="text-right">
                          {s.deliveryRatePercent !== null ? (
                            <Badge
                              variant={s.deliveryRatePercent >= 90 ? "default" : s.deliveryRatePercent >= 70 ? "secondary" : "destructive"}
                              className={s.deliveryRatePercent >= 90 ? "bg-green-600" : ""}
                            >
                              {s.deliveryRatePercent}%
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

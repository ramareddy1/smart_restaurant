"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { format } from "date-fns";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  SortingState,
} from "@tanstack/react-table";
import { ArrowUpDown, MoreHorizontal, Plus, Eye, Send, XCircle } from "lucide-react";

import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { usePurchaseOrders } from "@/hooks/use-kitchen";
import { useRouter } from "next/navigation";

const STATUS_BADGE: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; className?: string }> = {
  DRAFT: { label: "Draft", variant: "secondary" },
  SUBMITTED: { label: "Submitted", variant: "default", className: "bg-blue-600" },
  PARTIALLY_RECEIVED: { label: "Partial", variant: "default", className: "bg-amber-500" },
  RECEIVED: { label: "Received", variant: "default", className: "bg-green-600" },
  CANCELLED: { label: "Cancelled", variant: "destructive" },
};

interface PO {
  id: string;
  orderNumber: string;
  status: string;
  orderDate: string;
  expectedDate: string | null;
  totalCost: number | null;
  supplier: { id: string; name: string };
  createdBy: { id: string; name: string };
  items: unknown[];
  _count: { receivings: number };
}

export default function PurchaseOrdersPage() {
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [sorting, setSorting] = useState<SortingState>([]);
  const router = useRouter();

  const { orders, isLoading, mutate } = usePurchaseOrders({
    status: statusFilter === "ALL" ? undefined : statusFilter,
  });

  async function handleAction(id: string, action: "submit" | "cancel") {
    try {
      const res = await fetch(`/api/purchase-orders/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || `Failed to ${action}`);
      }
      toast.success(`Purchase order ${action === "submit" ? "submitted" : "cancelled"}`);
      mutate();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : `Failed to ${action}`);
    }
  }

  const fmt = (n: number | null) =>
    n != null ? new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n) : "—";

  const columns: ColumnDef<PO>[] = [
    {
      accessorKey: "orderNumber",
      header: ({ column }) => (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Order # <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <Link href={`/purchase-orders/${row.original.id}`} className="font-medium hover:underline">
          {row.getValue("orderNumber")}
        </Link>
      ),
    },
    {
      accessorKey: "supplier",
      header: "Supplier",
      cell: ({ row }) => row.original.supplier.name,
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.getValue("status") as string;
        const badge = STATUS_BADGE[status] ?? { label: status, variant: "outline" as const };
        return (
          <Badge variant={badge.variant} className={badge.className}>
            {badge.label}
          </Badge>
        );
      },
    },
    {
      id: "itemCount",
      header: "Items",
      cell: ({ row }) => row.original.items.length,
    },
    {
      accessorKey: "totalCost",
      header: "Total",
      cell: ({ row }) => fmt(row.getValue("totalCost")),
    },
    {
      accessorKey: "orderDate",
      header: ({ column }) => (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Date <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => format(new Date(row.getValue("orderDate")), "MMM d, yyyy"),
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const po = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => router.push(`/purchase-orders/${po.id}`)}>
                <Eye className="mr-2 h-4 w-4" /> View
              </DropdownMenuItem>
              {po.status === "DRAFT" && (
                <ConfirmDialog
                  title="Submit this purchase order?"
                  description={`Submit ${po.orderNumber} to ${po.supplier.name}. It can no longer be edited after submission.`}
                  onConfirm={() => handleAction(po.id, "submit")}
                >
                  <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                    <Send className="mr-2 h-4 w-4" /> Submit
                  </DropdownMenuItem>
                </ConfirmDialog>
              )}
              {!["RECEIVED", "CANCELLED"].includes(po.status) && (
                <ConfirmDialog
                  title="Cancel this purchase order?"
                  description="This action cannot be undone."
                  onConfirm={() => handleAction(po.id, "cancel")}
                >
                  <DropdownMenuItem className="text-destructive" onSelect={(e) => e.preventDefault()}>
                    <XCircle className="mr-2 h-4 w-4" /> Cancel
                  </DropdownMenuItem>
                </ConfirmDialog>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  const table = useReactTable({
    data: orders,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    state: { sorting },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Purchase Orders"
        description="Manage purchase orders and track deliveries"
        action={{ label: "New PO", href: "/purchase-orders/new" }}
      />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Statuses</SelectItem>
            <SelectItem value="DRAFT">Draft</SelectItem>
            <SelectItem value="SUBMITTED">Submitted</SelectItem>
            <SelectItem value="PARTIALLY_RECEIVED">Partially Received</SelectItem>
            <SelectItem value="RECEIVED">Received</SelectItem>
            <SelectItem value="CANCELLED">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <EmptyState
          title="No purchase orders"
          description={statusFilter !== "ALL" ? "No orders match this filter" : "Create your first purchase order"}
        >
          <Button asChild>
            <Link href="/purchase-orders/new">
              <Plus className="mr-2 h-4 w-4" /> New Purchase Order
            </Link>
          </Button>
        </EmptyState>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((hg) => (
                <TableRow key={hg.id}>
                  {hg.headers.map((h) => (
                    <TableHead key={h.id}>
                      {h.isPlaceholder ? null : flexRender(h.column.columnDef.header, h.getContext())}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}

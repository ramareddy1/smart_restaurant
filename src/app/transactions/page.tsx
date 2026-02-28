"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  SortingState,
} from "@tanstack/react-table";
import { ArrowUpDown, Plus } from "lucide-react";

import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
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
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { useTransactions } from "@/hooks/use-transactions";
import { formatCurrency, formatDateTime } from "@/lib/format";
import { TRANSACTION_TYPES } from "@/lib/constants";

interface Transaction {
  id: string;
  type: string;
  quantity: number;
  unitCost: number | null;
  totalCost: number | null;
  notes: string | null;
  createdAt: string;
  ingredient: { id: string; name: string; unit: string };
  supplier: { id: string; name: string } | null;
}

const typeColors: Record<string, string> = {
  PURCHASE: "bg-green-100 text-green-800",
  USAGE: "bg-blue-100 text-blue-800",
  WASTE: "bg-red-100 text-red-800",
  ADJUSTMENT: "bg-gray-100 text-gray-800",
};

export default function TransactionsPage() {
  const [type, setType] = useState("");
  const [sorting, setSorting] = useState<SortingState>([]);

  const { transactions, isLoading } = useTransactions({
    type: type || undefined,
  });

  const columns: ColumnDef<Transaction>[] = [
    {
      accessorKey: "createdAt",
      header: ({ column }) => (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Date <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => formatDateTime(row.getValue("createdAt")),
    },
    {
      accessorKey: "type",
      header: "Type",
      cell: ({ row }) => {
        const t = row.getValue("type") as string;
        return (
          <Badge variant="secondary" className={typeColors[t] ?? ""}>
            {t}
          </Badge>
        );
      },
    },
    {
      id: "ingredient",
      header: "Ingredient",
      cell: ({ row }) => row.original.ingredient?.name ?? "—",
    },
    {
      accessorKey: "quantity",
      header: "Quantity",
      cell: ({ row }) =>
        `${row.original.quantity} ${row.original.ingredient?.unit ?? ""}`,
    },
    {
      accessorKey: "unitCost",
      header: "Unit Cost",
      cell: ({ row }) => {
        const cost = row.getValue("unitCost") as number | null;
        return cost != null ? formatCurrency(cost) : "—";
      },
    },
    {
      accessorKey: "totalCost",
      header: "Total Cost",
      cell: ({ row }) => {
        const cost = row.getValue("totalCost") as number | null;
        return cost != null ? formatCurrency(cost) : "—";
      },
    },
    {
      id: "supplier",
      header: "Supplier",
      cell: ({ row }) => row.original.supplier?.name ?? "—",
    },
    {
      accessorKey: "notes",
      header: "Notes",
      cell: ({ row }) => {
        const notes = row.getValue("notes") as string | null;
        return notes
          ? notes.length > 30
            ? notes.slice(0, 30) + "..."
            : notes
          : "—";
      },
    },
  ];

  const table = useReactTable({
    data: transactions,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    state: { sorting },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Transactions"
        description="View and record inventory transactions"
        action={{ label: "Record Transaction", href: "/transactions/new" }}
      />

      <div className="flex flex-col gap-4 sm:flex-row">
        <Select value={type || "__all__"} onValueChange={(v) => setType(v === "__all__" ? "" : v)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">All types</SelectItem>
            {TRANSACTION_TYPES.map((t) => (
              <SelectItem key={t.value} value={t.value}>
                {t.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : transactions.length === 0 ? (
        <EmptyState title="No transactions found" description="Record your first transaction">
          <Button asChild>
            <Link href="/transactions/new">
              <Plus className="mr-2 h-4 w-4" /> Record Transaction
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

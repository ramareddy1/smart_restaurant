"use client";

import { useState, useDeferredValue } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  useReactTable,
  SortingState,
} from "@tanstack/react-table";
import { ArrowUpDown, MoreHorizontal, Plus, Trash2, Pencil } from "lucide-react";

import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { StockBadge } from "@/components/inventory/stock-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useIngredients } from "@/hooks/use-ingredients";
import { formatCurrency, formatDate } from "@/lib/format";
import { INGREDIENT_CATEGORIES, EXPIRY_WARNING_MS } from "@/lib/constants";

interface Ingredient {
  id: string;
  name: string;
  category: string;
  unit: string;
  currentStock: number;
  parLevel: number;
  costPerUnit: number;
  expirationDate: string | null;
  supplier: { id: string; name: string } | null;
}

export default function InventoryPage() {
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);
  const [category, setCategory] = useState("");
  const [sorting, setSorting] = useState<SortingState>([]);
  const router = useRouter();

  const { ingredients, isLoading, mutate } = useIngredients({
    search: deferredSearch || undefined,
    category: category || undefined,
  });

  const handleDelete = async (id: string, name: string) => {
    try {
      const res = await fetch(`/api/ingredients/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      toast.success(`"${name}" deleted`);
      mutate();
    } catch {
      toast.error("Failed to delete ingredient");
    }
  };

  const columns: ColumnDef<Ingredient>[] = [
    {
      accessorKey: "name",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Name <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <Link
          href={`/inventory/${row.original.id}`}
          className="font-medium hover:underline"
        >
          {row.getValue("name")}
        </Link>
      ),
    },
    {
      accessorKey: "category",
      header: "Category",
      cell: ({ row }) => <Badge variant="outline">{row.getValue("category")}</Badge>,
    },
    {
      accessorKey: "currentStock",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Stock <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const stock = row.original.currentStock;
        const unit = row.original.unit;
        return (
          <div className="flex items-center gap-2">
            <span>
              {stock} {unit}
            </span>
            <StockBadge
              currentStock={stock}
              parLevel={row.original.parLevel}
            />
          </div>
        );
      },
    },
    {
      accessorKey: "parLevel",
      header: "Par Level",
      cell: ({ row }) =>
        `${row.original.parLevel} ${row.original.unit}`,
    },
    {
      accessorKey: "costPerUnit",
      header: "Cost/Unit",
      cell: ({ row }) => formatCurrency(row.getValue("costPerUnit")),
    },
    {
      accessorKey: "supplier",
      header: "Supplier",
      cell: ({ row }) => row.original.supplier?.name ?? "—",
    },
    {
      accessorKey: "expirationDate",
      header: "Expires",
      cell: ({ row }) => {
        const date = row.getValue("expirationDate") as string | null;
        if (!date) return "—";
        const d = new Date(date);
        const isExpired = d < new Date();
        const isExpiringSoon =
          d < new Date(Date.now() + EXPIRY_WARNING_MS) && !isExpired;
        return (
          <span
            className={
              isExpired
                ? "text-red-600 font-medium"
                : isExpiringSoon
                ? "text-yellow-600 font-medium"
                : ""
            }
          >
            {formatDate(date)}
          </span>
        );
      },
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={() => router.push(`/inventory/${row.original.id}`)}
            >
              <Pencil className="mr-2 h-4 w-4" /> Edit
            </DropdownMenuItem>
            <ConfirmDialog
              title={`Delete "${row.original.name}"?`}
              description="This action cannot be undone. This will permanently delete this ingredient."
              onConfirm={() => handleDelete(row.original.id, row.original.name)}
            >
              <DropdownMenuItem
                className="text-destructive"
                onSelect={(e) => e.preventDefault()}
              >
                <Trash2 className="mr-2 h-4 w-4" /> Delete
              </DropdownMenuItem>
            </ConfirmDialog>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  const table = useReactTable({
    data: ingredients,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    state: { sorting },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Inventory"
        description="Manage your ingredients and stock levels"
        action={{ label: "Add Ingredient", href: "/inventory/new" }}
      />

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row">
        <Input
          placeholder="Search ingredients..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
        <Select value={category || "__all__"} onValueChange={(v) => setCategory(v === "__all__" ? "" : v)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">All categories</SelectItem>
            {INGREDIENT_CATEGORIES.map((cat) => (
              <SelectItem key={cat} value={cat}>
                {cat}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : ingredients.length === 0 ? (
        <EmptyState
          title="No ingredients found"
          description="Get started by adding your first ingredient"
        >
          <Button asChild>
            <Link href="/inventory/new">
              <Plus className="mr-2 h-4 w-4" /> Add Ingredient
            </Link>
          </Button>
        </EmptyState>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
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
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
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

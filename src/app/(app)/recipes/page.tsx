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
  useReactTable,
  SortingState,
} from "@tanstack/react-table";
import { ArrowUpDown, MoreHorizontal, Plus, Trash2, Pencil } from "lucide-react";

import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { useRecipes } from "@/hooks/use-recipes";
import { formatCurrency } from "@/lib/format";

interface Recipe {
  id: string;
  name: string;
  category: string | null;
  yieldQuantity: number;
  yieldUnit: string;
  ingredients: Array<{
    quantity: number;
    ingredient: { costPerUnit: number };
  }>;
}

export default function RecipesPage() {
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);
  const [sorting, setSorting] = useState<SortingState>([]);
  const router = useRouter();
  const { recipes, isLoading, mutate } = useRecipes({
    search: deferredSearch || undefined,
  });

  const handleDelete = async (id: string, name: string) => {
    try {
      const res = await fetch(`/api/recipes/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      toast.success(`"${name}" deleted`);
      mutate();
    } catch {
      toast.error("Failed to delete recipe");
    }
  };

  const columns: ColumnDef<Recipe>[] = [
    {
      accessorKey: "name",
      header: ({ column }) => (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Name <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <Link href={`/recipes/${row.original.id}`} className="font-medium hover:underline">
          {row.getValue("name")}
        </Link>
      ),
    },
    {
      accessorKey: "category",
      header: "Category",
      cell: ({ row }) => {
        const cat = row.getValue("category") as string | null;
        return cat ? <Badge variant="outline">{cat}</Badge> : "—";
      },
    },
    {
      id: "ingredientCount",
      header: "Ingredients",
      cell: ({ row }) => row.original.ingredients?.length ?? 0,
    },
    {
      id: "cost",
      header: ({ column }) => (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Cost <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      accessorFn: (row) =>
        row.ingredients?.reduce(
          (sum, ri) => sum + ri.quantity * ri.ingredient.costPerUnit,
          0
        ) ?? 0,
      cell: ({ getValue }) => formatCurrency(getValue() as number),
    },
    {
      id: "yield",
      header: "Yield",
      cell: ({ row }) =>
        `${row.original.yieldQuantity} ${row.original.yieldUnit}`,
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
            <DropdownMenuItem onClick={() => router.push(`/recipes/${row.original.id}`)}>
              <Pencil className="mr-2 h-4 w-4" /> Edit
            </DropdownMenuItem>
            <ConfirmDialog
              title={`Delete "${row.original.name}"?`}
              description="This action cannot be undone. This will permanently delete this recipe."
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
    data: recipes,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    state: { sorting },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Recipes"
        description="Manage your recipes and track ingredient costs"
        action={{ label: "Add Recipe", href: "/recipes/new" }}
      />

      <Input
        placeholder="Search recipes..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="max-w-sm"
      />

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : recipes.length === 0 ? (
        <EmptyState title="No recipes found" description="Create your first recipe">
          <Button asChild>
            <Link href="/recipes/new"><Plus className="mr-2 h-4 w-4" /> Add Recipe</Link>
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

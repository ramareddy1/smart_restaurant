"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency } from "@/lib/format";
import type { MenuEngineeringItem } from "@/hooks/use-menu-engineering";

const CLASS_BADGE: Record<string, { label: string; className: string }> = {
  Star: { label: "Star", className: "bg-green-100 text-green-700 border-green-200" },
  "Plow Horse": { label: "Plow Horse", className: "bg-amber-100 text-amber-700 border-amber-200" },
  Puzzle: { label: "Puzzle", className: "bg-blue-100 text-blue-700 border-blue-200" },
  Dog: { label: "Dog", className: "bg-red-100 text-red-700 border-red-200" },
};

interface TableProps {
  items: MenuEngineeringItem[];
}

export function EngineeringTable({ items }: TableProps) {
  if (items.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Menu Item Analysis</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Item</TableHead>
              <TableHead>Category</TableHead>
              <TableHead className="text-right">Price</TableHead>
              <TableHead className="text-right">Recipe Cost</TableHead>
              <TableHead className="text-right">Food Cost %</TableHead>
              <TableHead className="text-right">Profit</TableHead>
              <TableHead>Classification</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => {
              const badge = CLASS_BADGE[item.classification];
              return (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell>{item.category ?? "—"}</TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(item.price)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(item.recipeCost)}
                  </TableCell>
                  <TableCell className="text-right">
                    <span
                      className={
                        item.foodCostPct > 35
                          ? "text-red-600 font-medium"
                          : item.foodCostPct > 28
                          ? "text-amber-600"
                          : "text-green-600"
                      }
                    >
                      {item.foodCostPct.toFixed(1)}%
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(item.profitMargin)}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={badge?.className}>
                      {badge?.label ?? item.classification}
                    </Badge>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

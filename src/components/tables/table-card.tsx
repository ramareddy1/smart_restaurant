"use client";

import { Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { TableStatusBadge } from "./table-status-badge";

interface TableCardProps {
  table: {
    id: string;
    number: number;
    name: string | null;
    seats: number;
    status: string;
    orders: Array<{
      id: string;
      orderNumber: string;
      status: string;
      guestCount: number;
    }>;
  };
  onClick?: () => void;
}

export function TableCard({ table, onClick }: TableCardProps) {
  const activeOrder = table.orders[0];

  return (
    <Card
      className={`cursor-pointer transition-all hover:shadow-md ${
        table.status === "OCCUPIED"
          ? "border-red-200 bg-red-50/50"
          : table.status === "RESERVED"
          ? "border-purple-200 bg-purple-50/50"
          : table.status === "CLEANING"
          ? "border-amber-200 bg-amber-50/50"
          : "border-green-200 hover:border-green-300"
      }`}
      onClick={onClick}
    >
      <CardContent className="pt-4 pb-4">
        <div className="flex items-center justify-between mb-2">
          <div className="text-lg font-bold">
            Table {table.number}
          </div>
          <TableStatusBadge status={table.status} />
        </div>
        {table.name && (
          <p className="text-xs text-muted-foreground mb-1">{table.name}</p>
        )}
        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          <Users className="h-3 w-3" />
          <span>{table.seats} seats</span>
        </div>
        {activeOrder && (
          <div className="mt-2 pt-2 border-t text-xs">
            <span className="font-medium">{activeOrder.orderNumber}</span>
            <span className="text-muted-foreground ml-1">
              ({activeOrder.guestCount} guests)
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

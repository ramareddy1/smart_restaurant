"use client";

import { Badge } from "@/components/ui/badge";

interface StockBadgeProps {
  currentStock: number;
  parLevel: number;
}

export function StockBadge({ currentStock, parLevel }: StockBadgeProps) {
  if (currentStock > parLevel * 3) {
    return (
      <Badge variant="secondary" className="bg-purple-100 text-purple-800">
        Overstock
      </Badge>
    );
  }
  if (currentStock >= parLevel) {
    return (
      <Badge variant="secondary" className="bg-green-100 text-green-800">
        OK
      </Badge>
    );
  }
  if (currentStock >= parLevel * 0.5) {
    return (
      <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
        Low
      </Badge>
    );
  }
  return (
    <Badge variant="destructive">
      Critical
    </Badge>
  );
}

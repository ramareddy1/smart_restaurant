"use client";

import { Badge } from "@/components/ui/badge";
import {
  STOCK_OVERSTOCK_MULTIPLIER,
  STOCK_CRITICAL_MULTIPLIER,
} from "@/lib/constants";

interface StockBadgeProps {
  currentStock: number;
  parLevel: number;
}

export function StockBadge({ currentStock, parLevel }: StockBadgeProps) {
  if (currentStock > parLevel * STOCK_OVERSTOCK_MULTIPLIER) {
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
  if (currentStock >= parLevel * STOCK_CRITICAL_MULTIPLIER) {
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

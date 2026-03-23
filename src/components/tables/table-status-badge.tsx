"use client";

import { Badge } from "@/components/ui/badge";

const statusConfig: Record<string, { label: string; className: string }> = {
  AVAILABLE: { label: "Available", className: "bg-green-100 text-green-700" },
  OCCUPIED: { label: "Occupied", className: "bg-red-100 text-red-700" },
  RESERVED: { label: "Reserved", className: "bg-purple-100 text-purple-700" },
  CLEANING: { label: "Cleaning", className: "bg-amber-100 text-amber-700" },
};

export function TableStatusBadge({ status }: { status: string }) {
  const config = statusConfig[status] ?? { label: status, className: "" };
  return (
    <Badge variant="outline" className={config.className}>
      {config.label}
    </Badge>
  );
}

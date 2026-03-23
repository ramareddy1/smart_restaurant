"use client";

import { Badge } from "@/components/ui/badge";

const statusConfig: Record<string, { label: string; className: string }> = {
  OPEN: { label: "Open", className: "bg-blue-100 text-blue-700" },
  SENT_TO_KITCHEN: { label: "Sent to Kitchen", className: "bg-indigo-100 text-indigo-700" },
  PREPARING: { label: "Preparing", className: "bg-amber-100 text-amber-700" },
  READY: { label: "Ready", className: "bg-green-100 text-green-700" },
  SERVED: { label: "Served", className: "bg-teal-100 text-teal-700" },
  CLOSED: { label: "Closed", className: "bg-gray-100 text-gray-700" },
  CANCELLED: { label: "Cancelled", className: "bg-red-100 text-red-700" },
};

export function OrderStatusBadge({ status }: { status: string }) {
  const config = statusConfig[status] ?? { label: status, className: "" };
  return (
    <Badge variant="outline" className={config.className}>
      {config.label}
    </Badge>
  );
}

const itemStatusConfig: Record<string, { label: string; className: string }> = {
  PENDING: { label: "Pending", className: "bg-gray-100 text-gray-700" },
  PREPARING: { label: "Preparing", className: "bg-amber-100 text-amber-700" },
  READY: { label: "Ready", className: "bg-green-100 text-green-700" },
  SERVED: { label: "Served", className: "bg-teal-100 text-teal-700" },
  CANCELLED: { label: "Cancelled", className: "bg-red-100 text-red-700" },
};

export function OrderItemStatusBadge({ status }: { status: string }) {
  const config = itemStatusConfig[status] ?? { label: status, className: "" };
  return (
    <Badge variant="outline" className={`text-xs ${config.className}`}>
      {config.label}
    </Badge>
  );
}

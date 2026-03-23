"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/format";

interface BillSummaryProps {
  bill: {
    items: Array<{
      name: string;
      quantity: number;
      unitPrice: number;
      lineTotal: number;
    }>;
    subtotal: number;
    taxRate: number;
    tax: number;
    total: number;
    totalPaid: number;
    totalTip: number;
    remaining: number;
    isFullyPaid: boolean;
    payments: Array<{
      id: string;
      method: string;
      amount: number;
      tip: number;
      paidAt: string;
    }>;
  };
}

export function BillSummary({ bill }: BillSummaryProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Bill</CardTitle>
          {bill.isFullyPaid ? (
            <Badge className="bg-green-100 text-green-700">Paid</Badge>
          ) : (
            <Badge className="bg-amber-100 text-amber-700">
              {formatCurrency(bill.remaining)} remaining
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Line Items */}
        <div className="space-y-1">
          {bill.items.map((item, i) => (
            <div key={i} className="flex justify-between text-sm">
              <span>
                {item.quantity}x {item.name}
              </span>
              <span>{formatCurrency(item.lineTotal)}</span>
            </div>
          ))}
        </div>

        <div className="border-t pt-2 space-y-1">
          <div className="flex justify-between text-sm">
            <span>Subtotal</span>
            <span>{formatCurrency(bill.subtotal)}</span>
          </div>
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Tax ({(bill.taxRate * 100).toFixed(1)}%)</span>
            <span>{formatCurrency(bill.tax)}</span>
          </div>
          <div className="flex justify-between font-bold">
            <span>Total</span>
            <span>{formatCurrency(bill.total)}</span>
          </div>
        </div>

        {/* Payments */}
        {bill.payments.length > 0 && (
          <div className="border-t pt-2 space-y-1">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase">
              Payments
            </h4>
            {bill.payments.map((p) => (
              <div key={p.id} className="flex justify-between text-sm">
                <span>
                  {p.method}
                  {p.tip > 0 && (
                    <span className="text-muted-foreground">
                      {" "}
                      (+ {formatCurrency(p.tip)} tip)
                    </span>
                  )}
                </span>
                <span>{formatCurrency(p.amount)}</span>
              </div>
            ))}
            <div className="flex justify-between text-sm font-medium">
              <span>Total Paid</span>
              <span>{formatCurrency(bill.totalPaid)}</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

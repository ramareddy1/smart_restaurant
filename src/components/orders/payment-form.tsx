"use client";

import { useState } from "react";
import { CreditCard, Banknote, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/format";

interface PaymentFormProps {
  orderId: string;
  remainingAmount: number;
  onPaymentAdded: () => void;
}

export function PaymentForm({
  orderId,
  remainingAmount,
  onPaymentAdded,
}: PaymentFormProps) {
  const [method, setMethod] = useState<"CASH" | "CARD" | "DIGITAL">("CARD");
  const [amount, setAmount] = useState(remainingAmount);
  const [tip, setTip] = useState(0);
  const [reference, setReference] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    try {
      const res = await fetch(`/api/orders/${orderId}/payments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          method,
          amount,
          tip,
          reference: reference || null,
        }),
      });

      if (!res.ok) throw new Error("Failed to add payment");
      setAmount(0);
      setTip(0);
      setReference("");
      onPaymentAdded();
    } catch {
      alert("Failed to add payment");
    } finally {
      setSaving(false);
    }
  }

  const methods = [
    { value: "CARD" as const, label: "Card", icon: CreditCard },
    { value: "CASH" as const, label: "Cash", icon: Banknote },
    { value: "DIGITAL" as const, label: "Digital", icon: Smartphone },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Add Payment</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Method Selection */}
          <div className="flex gap-2">
            {methods.map((m) => (
              <Button
                key={m.value}
                type="button"
                variant={method === m.value ? "default" : "outline"}
                size="sm"
                onClick={() => setMethod(m.value)}
                className="flex-1"
              >
                <m.icon className="h-4 w-4 mr-1" />
                {m.label}
              </Button>
            ))}
          </div>

          <div className="grid gap-3 grid-cols-2">
            <div>
              <Label htmlFor="amount">Amount</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min={0.01}
                value={amount}
                onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                required
              />
              <p className="text-xs text-muted-foreground mt-1">
                Remaining: {formatCurrency(remainingAmount)}
              </p>
            </div>
            <div>
              <Label htmlFor="tip">Tip</Label>
              <Input
                id="tip"
                type="number"
                step="0.01"
                min={0}
                value={tip}
                onChange={(e) => setTip(parseFloat(e.target.value) || 0)}
              />
            </div>
          </div>

          {method === "CARD" && (
            <div>
              <Label htmlFor="reference">Card Last 4 / Reference</Label>
              <Input
                id="reference"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder="e.g., 4242"
                maxLength={20}
              />
            </div>
          )}

          <Button type="submit" disabled={saving || amount <= 0} className="w-full">
            {saving
              ? "Processing..."
              : `Pay ${formatCurrency(amount)}${tip > 0 ? ` + ${formatCurrency(tip)} tip` : ""}`}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface TableFormProps {
  initialData?: {
    id: string;
    number: number;
    name: string | null;
    seats: number;
  };
}

export function TableForm({ initialData }: TableFormProps) {
  const router = useRouter();
  const isEditing = !!initialData;
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    number: initialData?.number ?? 1,
    name: initialData?.name ?? "",
    seats: initialData?.seats ?? 4,
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    try {
      const url = isEditing ? `/api/tables/${initialData.id}` : "/api/tables";
      const method = isEditing ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          number: form.number,
          name: form.name || null,
          seats: form.seats,
        }),
      });

      if (!res.ok) throw new Error("Failed to save");
      router.push("/tables");
      router.refresh();
    } catch {
      alert("Failed to save table");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader>
          <CardTitle>{isEditing ? "Edit Table" : "Add Table"}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <Label htmlFor="number">Table Number</Label>
              <Input
                id="number"
                type="number"
                min={1}
                value={form.number}
                onChange={(e) =>
                  setForm({ ...form, number: parseInt(e.target.value) || 1 })
                }
                required
              />
            </div>
            <div>
              <Label htmlFor="name">Name (optional)</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g., Window Booth"
              />
            </div>
            <div>
              <Label htmlFor="seats">Seats</Label>
              <Input
                id="seats"
                type="number"
                min={1}
                value={form.seats}
                onChange={(e) =>
                  setForm({ ...form, seats: parseInt(e.target.value) || 1 })
                }
                required
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Button type="submit" disabled={saving}>
              {saving ? "Saving..." : isEditing ? "Update Table" : "Add Table"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/tables")}
            >
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}

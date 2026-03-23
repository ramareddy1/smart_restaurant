"use client";

import { useState } from "react";
import { Plus, Minus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface MenuItemOption {
  id: string;
  name: string;
  price: number;
  category: string | null;
}

export interface SelectedOrderItem {
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
  specialInstructions: string;
}

interface OrderItemPickerProps {
  menuItems: MenuItemOption[];
  selectedItems: SelectedOrderItem[];
  onItemsChange: (items: SelectedOrderItem[]) => void;
}

export function OrderItemPicker({
  menuItems,
  selectedItems,
  onItemsChange,
}: OrderItemPickerProps) {
  const [search, setSearch] = useState("");

  const categories = [...new Set(menuItems.map((i) => i.category ?? "Other"))];
  const filtered = menuItems.filter((i) =>
    i.name.toLowerCase().includes(search.toLowerCase())
  );

  function addItem(item: MenuItemOption) {
    const existing = selectedItems.find((si) => si.menuItemId === item.id);
    if (existing) {
      onItemsChange(
        selectedItems.map((si) =>
          si.menuItemId === item.id
            ? { ...si, quantity: si.quantity + 1 }
            : si
        )
      );
    } else {
      onItemsChange([
        ...selectedItems,
        {
          menuItemId: item.id,
          name: item.name,
          price: item.price,
          quantity: 1,
          specialInstructions: "",
        },
      ]);
    }
  }

  function updateQuantity(menuItemId: string, delta: number) {
    const updated = selectedItems
      .map((si) =>
        si.menuItemId === menuItemId
          ? { ...si, quantity: si.quantity + delta }
          : si
      )
      .filter((si) => si.quantity > 0);
    onItemsChange(updated);
  }

  function updateInstructions(menuItemId: string, instructions: string) {
    onItemsChange(
      selectedItems.map((si) =>
        si.menuItemId === menuItemId
          ? { ...si, specialInstructions: instructions }
          : si
      )
    );
  }

  function removeItem(menuItemId: string) {
    onItemsChange(selectedItems.filter((si) => si.menuItemId !== menuItemId));
  }

  const subtotal = selectedItems.reduce(
    (sum, si) => sum + si.price * si.quantity,
    0
  );

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {/* Menu Browser */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Menu</CardTitle>
          <Input
            placeholder="Search menu items..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </CardHeader>
        <CardContent className="max-h-[500px] overflow-y-auto space-y-4">
          {categories.map((cat) => {
            const items = filtered.filter(
              (i) => (i.category ?? "Other") === cat
            );
            if (items.length === 0) return null;
            return (
              <div key={cat}>
                <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-2">
                  {cat}
                </h4>
                <div className="space-y-1">
                  {items.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => addItem(item)}
                      className="w-full flex items-center justify-between rounded-lg border p-2 hover:bg-muted/50 transition-colors text-left"
                    >
                      <span className="text-sm">{item.name}</span>
                      <span className="text-sm font-medium">
                        ${item.price.toFixed(2)}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Selected Items */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Order Items</CardTitle>
            <Badge variant="secondary">
              {selectedItems.length} items
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {selectedItems.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              Click menu items to add them to the order
            </p>
          ) : (
            <>
              {selectedItems.map((item) => (
                <div key={item.menuItemId} className="border rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">{item.name}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={() => removeItem(item.menuItemId)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-7 w-7 p-0"
                      onClick={() => updateQuantity(item.menuItemId, -1)}
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    <span className="w-8 text-center text-sm font-medium">
                      {item.quantity}
                    </span>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-7 w-7 p-0"
                      onClick={() => updateQuantity(item.menuItemId, 1)}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                    <span className="ml-auto text-sm font-medium">
                      ${(item.price * item.quantity).toFixed(2)}
                    </span>
                  </div>
                  <Input
                    className="mt-2 h-8 text-xs"
                    placeholder="Special instructions..."
                    value={item.specialInstructions}
                    onChange={(e) =>
                      updateInstructions(item.menuItemId, e.target.value)
                    }
                  />
                </div>
              ))}

              <div className="border-t pt-3 flex items-center justify-between font-medium">
                <span>Subtotal</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

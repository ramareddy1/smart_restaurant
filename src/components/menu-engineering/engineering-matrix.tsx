"use client";

import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Cell,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { MenuEngineeringItem } from "@/hooks/use-menu-engineering";

const CLASS_COLORS: Record<string, string> = {
  Star: "#22c55e",
  "Plow Horse": "#f59e0b",
  Puzzle: "#3b82f6",
  Dog: "#ef4444",
};

interface MatrixProps {
  items: MenuEngineeringItem[];
}

export function EngineeringMatrix({ items }: MatrixProps) {
  if (items.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Menu Engineering Matrix</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            No menu items with cost data available.
          </p>
        </CardContent>
      </Card>
    );
  }

  const avgFoodCost =
    items.reduce((sum, i) => sum + i.foodCostPct, 0) / items.length;

  const data = items.map((item) => ({
    x: item.profitMargin,
    y: item.foodCostPct,
    name: item.name,
    classification: item.classification,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Menu Engineering Matrix</span>
          <div className="flex gap-3 text-xs font-normal">
            {Object.entries(CLASS_COLORS).map(([label, color]) => (
              <span key={label} className="flex items-center gap-1">
                <span
                  className="inline-block h-3 w-3 rounded-full"
                  style={{ backgroundColor: color }}
                />
                {label}
              </span>
            ))}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={400}>
          <ScatterChart margin={{ top: 20, right: 30, bottom: 20, left: 20 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              type="number"
              dataKey="x"
              name="Profit Margin"
              unit="$"
              label={{
                value: "Profit Margin ($)",
                position: "bottom",
                offset: 0,
              }}
            />
            <YAxis
              type="number"
              dataKey="y"
              name="Food Cost %"
              unit="%"
              label={{
                value: "Food Cost %",
                angle: -90,
                position: "insideLeft",
              }}
            />
            <Tooltip
              content={({ payload }) => {
                if (!payload?.length) return null;
                const d = payload[0].payload;
                return (
                  <div className="rounded-lg border bg-background p-3 shadow-sm">
                    <p className="font-medium">{d.name}</p>
                    <p className="text-sm text-muted-foreground">
                      Food Cost: {d.y.toFixed(1)}%
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Profit: ${d.x.toFixed(2)}
                    </p>
                    <p className="text-sm font-medium" style={{ color: CLASS_COLORS[d.classification] }}>
                      {d.classification}
                    </p>
                  </div>
                );
              }}
            />
            <ReferenceLine
              y={avgFoodCost}
              stroke="#94a3b8"
              strokeDasharray="5 5"
              label={{
                value: `Avg: ${avgFoodCost.toFixed(1)}%`,
                position: "right",
              }}
            />
            <Scatter data={data}>
              {data.map((entry, index) => (
                <Cell
                  key={index}
                  fill={CLASS_COLORS[entry.classification] ?? "#94a3b8"}
                  r={8}
                />
              ))}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

"use client";

import { Loader2, BarChart3 } from "lucide-react";
import { useMenuEngineering } from "@/hooks/use-menu-engineering";
import { EngineeringMatrix } from "@/components/menu-engineering/engineering-matrix";
import { EngineeringTable } from "@/components/menu-engineering/engineering-table";
import { AIAnalysisCard } from "@/components/shared/ai-analysis-card";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/format";

export default function MenuEngineeringPage() {
  const { items, isLoading } = useMenuEngineering();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Summary stats
  const stars = items.filter((i) => i.classification === "Star");
  const plowHorses = items.filter((i) => i.classification === "Plow Horse");
  const puzzles = items.filter((i) => i.classification === "Puzzle");
  const dogs = items.filter((i) => i.classification === "Dog");
  const avgFoodCost =
    items.length > 0
      ? items.reduce((s, i) => s + i.foodCostPct, 0) / items.length
      : 0;
  const avgMargin =
    items.length > 0
      ? items.reduce((s, i) => s + i.profitMargin, 0) / items.length
      : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <BarChart3 className="h-6 w-6" />
          Menu Engineering
        </h1>
        <p className="text-muted-foreground">
          BCG Matrix analysis of your menu items by profitability and popularity.
        </p>
      </div>

      {/* KPI Summary */}
      <div className="grid gap-4 md:grid-cols-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-600">
              {stars.length}
            </div>
            <p className="text-xs text-muted-foreground">Stars</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-amber-600">
              {plowHorses.length}
            </div>
            <p className="text-xs text-muted-foreground">Plow Horses</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-blue-600">
              {puzzles.length}
            </div>
            <p className="text-xs text-muted-foreground">Puzzles</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-red-600">
              {dogs.length}
            </div>
            <p className="text-xs text-muted-foreground">Dogs</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{avgFoodCost.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">Avg Food Cost</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">
              {formatCurrency(avgMargin)}
            </div>
            <p className="text-xs text-muted-foreground">Avg Margin</p>
          </CardContent>
        </Card>
      </div>

      {/* Scatter Chart */}
      <EngineeringMatrix items={items} />

      {/* Data Table */}
      <EngineeringTable items={items} />

      {/* AI Analysis */}
      <AIAnalysisCard
        title="AI Menu Engineering Analysis"
        description="Get AI-powered recommendations on pricing, promotions, and menu optimization based on your menu engineering data."
        endpoint="/api/ai/menu-engineering"
      />
    </div>
  );
}

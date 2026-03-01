"use client";

import { ChefHat, DollarSign, ShieldAlert, ClipboardList, Loader2 } from "lucide-react";
import useSWR from "swr";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AIAnalysisCard } from "@/components/shared/ai-analysis-card";
import { formatCurrency } from "@/lib/format";
import Link from "next/link";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function ChefDashboardPage() {
  const { data: recipesData, isLoading: loadingRecipes } = useSWR(
    "/api/recipes?pageSize=200",
    fetcher
  );
  const { data: engineeringData, isLoading: loadingEng } = useSWR(
    "/api/menu-engineering",
    fetcher
  );
  const { data: prepTasks, isLoading: loadingPrep } = useSWR(
    `/api/prep-tasks?date=${new Date().toISOString().split("T")[0]}`,
    fetcher
  );
  const { data: allergensData, isLoading: loadingAllergens } = useSWR(
    "/api/allergens",
    fetcher
  );

  const isLoading =
    loadingRecipes || loadingEng || loadingPrep || loadingAllergens;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const recipes = recipesData?.items ?? [];
  const engineering: Array<{
    foodCostPct: number;
    classification: string;
  }> = engineeringData ?? [];
  const todayTasks: Array<{
    id: string;
    name: string;
    status: string;
    estimatedMin: number | null;
  }> = prepTasks ?? [];
  const allergenCount = (allergensData as Array<unknown>)?.length ?? 0;

  // KPIs
  const recipeCount = recipes.length;
  const avgFoodCost =
    engineering.length > 0
      ? engineering.reduce(
          (s: number, i: { foodCostPct: number }) => s + i.foodCostPct,
          0
        ) / engineering.length
      : 0;
  const starsCount = engineering.filter(
    (i: { classification: string }) => i.classification === "Star"
  ).length;
  const pendingPrep = todayTasks.filter(
    (t: { status: string }) => t.status !== "COMPLETED"
  ).length;
  const completedPrep = todayTasks.filter(
    (t: { status: string }) => t.status === "COMPLETED"
  ).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <ChefHat className="h-6 w-6" />
          Chef Dashboard
        </h1>
        <p className="text-muted-foreground">
          Recipe costing, allergens, menu engineering, and prep planning at a
          glance.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Recipes</CardTitle>
            <ChefHat className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{recipeCount}</div>
            <p className="text-xs text-muted-foreground">
              Active recipes in system
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Avg Food Cost %
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${
                avgFoodCost > 35
                  ? "text-red-600"
                  : avgFoodCost > 28
                  ? "text-amber-600"
                  : "text-green-600"
              }`}
            >
              {avgFoodCost.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              Target: 28-35% · {starsCount} Stars on menu
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Allergen Coverage
            </CardTitle>
            <ShieldAlert className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{allergenCount}</div>
            <p className="text-xs text-muted-foreground">
              Allergens tracked in system
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Today&apos;s Prep
            </CardTitle>
            <ClipboardList className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {completedPrep}/{todayTasks.length}
            </div>
            <p className="text-xs text-muted-foreground">
              {pendingPrep > 0
                ? `${pendingPrep} tasks remaining`
                : "All prep done!"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Today's Prep Tasks */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Today&apos;s Prep Tasks</CardTitle>
            <Link href="/prep">
              <Badge variant="outline" className="cursor-pointer">
                View All
              </Badge>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {todayTasks.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No prep tasks scheduled for today.
            </p>
          ) : (
            <div className="space-y-2">
              {todayTasks.slice(0, 5).map((task) => (
                <div
                  key={task.id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <span
                    className={`text-sm ${
                      task.status === "COMPLETED"
                        ? "line-through text-muted-foreground"
                        : ""
                    }`}
                  >
                    {task.name}
                  </span>
                  <div className="flex items-center gap-2">
                    {task.estimatedMin && (
                      <span className="text-xs text-muted-foreground">
                        ~{task.estimatedMin} min
                      </span>
                    )}
                    <Badge
                      variant="outline"
                      className={
                        task.status === "COMPLETED"
                          ? "bg-green-100 text-green-700"
                          : task.status === "IN_PROGRESS"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-gray-100 text-gray-700"
                      }
                    >
                      {task.status === "IN_PROGRESS"
                        ? "In Progress"
                        : task.status === "COMPLETED"
                        ? "Done"
                        : "Pending"}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Menu Performance Overview */}
      {engineering.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Menu Performance</CardTitle>
              <Link href="/menu-engineering">
                <Badge variant="outline" className="cursor-pointer">
                  Full Analysis
                </Badge>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 gap-4 text-center">
              {[
                {
                  label: "Stars",
                  count: engineering.filter((i) => i.classification === "Star")
                    .length,
                  color: "text-green-600",
                },
                {
                  label: "Plow Horses",
                  count: engineering.filter(
                    (i) => i.classification === "Plow Horse"
                  ).length,
                  color: "text-amber-600",
                },
                {
                  label: "Puzzles",
                  count: engineering.filter(
                    (i) => i.classification === "Puzzle"
                  ).length,
                  color: "text-blue-600",
                },
                {
                  label: "Dogs",
                  count: engineering.filter((i) => i.classification === "Dog")
                    .length,
                  color: "text-red-600",
                },
              ].map((cat) => (
                <div key={cat.label}>
                  <div className={`text-2xl font-bold ${cat.color}`}>
                    {cat.count}
                  </div>
                  <p className="text-xs text-muted-foreground">{cat.label}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Links */}
      <div className="grid gap-4 md:grid-cols-4">
        {[
          { title: "Recipes", href: "/recipes", desc: "Manage recipes" },
          {
            title: "Allergens",
            href: "/allergens",
            desc: "Manage allergens",
          },
          {
            title: "Menu Engineering",
            href: "/menu-engineering",
            desc: "BCG analysis",
          },
          { title: "Prep Planning", href: "/prep", desc: "Daily tasks" },
        ].map((link) => (
          <Link key={link.href} href={link.href}>
            <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
              <CardContent className="pt-6">
                <div className="font-medium">{link.title}</div>
                <p className="text-xs text-muted-foreground">{link.desc}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* AI Analysis */}
      <AIAnalysisCard
        title="AI Recipe Cost Optimizer"
        description="Select a recipe in the Recipes page to get AI-powered cost optimization suggestions, or use the Menu Engineering AI above."
        endpoint="/api/ai/menu-engineering"
      />
    </div>
  );
}

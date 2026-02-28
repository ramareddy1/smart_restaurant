"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  AlertTriangle,
  Bell,
  CheckCircle,
  Clock,
  Package,
  Sparkles,
  X,
  Zap,
} from "lucide-react";

import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { useAlerts } from "@/hooks/use-alerts";
import { formatRelativeDate } from "@/lib/format";

interface Alert {
  id: string;
  type: string;
  severity: string;
  title: string;
  message: string;
  isRead: boolean;
  isDismissed: boolean;
  createdAt: string;
  ingredient: { id: string; name: string } | null;
}

const severityConfig: Record<
  string,
  { color: string; icon: React.ElementType }
> = {
  CRITICAL: { color: "bg-red-100 text-red-800", icon: AlertTriangle },
  WARNING: { color: "bg-yellow-100 text-yellow-800", icon: Clock },
  INFO: { color: "bg-blue-100 text-blue-800", icon: Bell },
};

const typeIcons: Record<string, React.ElementType> = {
  LOW_STOCK: Package,
  EXPIRING: Clock,
  OVERSTOCK: Package,
  AI_RECOMMENDATION: Sparkles,
};

export default function AlertsPage() {
  const [typeFilter, setTypeFilter] = useState("");
  const [severityFilter, setSeverityFilter] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const { alerts, isLoading, mutate } = useAlerts({
    type: typeFilter || undefined,
    severity: severityFilter || undefined,
  });

  const handleMarkRead = async (id: string) => {
    try {
      await fetch(`/api/alerts/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isRead: true }),
      });
      mutate();
    } catch {
      toast.error("Failed to update alert");
    }
  };

  const handleDismiss = async (id: string) => {
    try {
      await fetch(`/api/alerts/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isDismissed: true }),
      });
      toast.success("Alert dismissed");
      mutate();
    } catch {
      toast.error("Failed to dismiss alert");
    }
  };

  const handleRunAnalysis = async () => {
    setIsAnalyzing(true);
    try {
      const res = await fetch("/api/ai/analyze", { method: "POST" });
      if (!res.ok) throw new Error("Analysis failed");
      toast.success("AI analysis complete! Check recommendations below.");
      mutate();
    } catch {
      toast.error("AI analysis failed. Check your API key configuration.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleRunRuleCheck = async () => {
    try {
      // Trigger rule engine by hitting a transaction-like endpoint or dedicated endpoint
      const res = await fetch("/api/alerts/check", { method: "POST" });
      if (!res.ok) throw new Error("Check failed");
      toast.success("Rule check complete!");
      mutate();
    } catch {
      toast.error("Rule check failed");
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Alerts & Recommendations"
        description="Monitor alerts and get AI-powered insights"
      />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-3">
          <Select value={typeFilter || "__all__"} onValueChange={(v) => setTypeFilter(v === "__all__" ? "" : v)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">All types</SelectItem>
              <SelectItem value="LOW_STOCK">Low Stock</SelectItem>
              <SelectItem value="EXPIRING">Expiring</SelectItem>
              <SelectItem value="OVERSTOCK">Overstock</SelectItem>
              <SelectItem value="AI_RECOMMENDATION">AI Insights</SelectItem>
            </SelectContent>
          </Select>

          <Select value={severityFilter || "__all__"} onValueChange={(v) => setSeverityFilter(v === "__all__" ? "" : v)}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="All severity" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">All severity</SelectItem>
              <SelectItem value="CRITICAL">Critical</SelectItem>
              <SelectItem value="WARNING">Warning</SelectItem>
              <SelectItem value="INFO">Info</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={handleRunRuleCheck}>
            <Zap className="mr-2 h-4 w-4" /> Run Checks
          </Button>
          <Button onClick={handleRunAnalysis} disabled={isAnalyzing}>
            <Sparkles className="mr-2 h-4 w-4" />
            {isAnalyzing ? "Analyzing..." : "Run AI Analysis"}
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      ) : alerts.length === 0 ? (
        <EmptyState
          icon={CheckCircle}
          title="All clear!"
          description="No alerts at the moment. Run AI Analysis for proactive insights."
        />
      ) : (
        <div className="space-y-3">
          {alerts.map((alert: Alert) => {
            const config = severityConfig[alert.severity] ?? severityConfig.INFO;
            const TypeIcon = typeIcons[alert.type] ?? Bell;
            const isAI = alert.type === "AI_RECOMMENDATION";

            return (
              <Card
                key={alert.id}
                className={`${!alert.isRead ? "border-l-4 border-l-primary" : ""} ${
                  alert.isDismissed ? "opacity-50" : ""
                }`}
              >
                <CardContent className="py-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1">
                      <TypeIcon className="h-5 w-5 mt-0.5 text-muted-foreground shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-sm">
                            {alert.title}
                          </span>
                          <Badge
                            variant="secondary"
                            className={config.color}
                          >
                            {alert.severity}
                          </Badge>
                          {isAI && (
                            <Badge
                              variant="secondary"
                              className="bg-purple-100 text-purple-800"
                            >
                              AI Insight
                            </Badge>
                          )}
                        </div>
                        <p
                          className={`mt-1 text-sm text-muted-foreground ${
                            isAI ? "whitespace-pre-wrap" : ""
                          }`}
                        >
                          {alert.message}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {formatRelativeDate(alert.createdAt)}
                          {alert.ingredient && (
                            <> &middot; {alert.ingredient.name}</>
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      {!alert.isRead && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleMarkRead(alert.id)}
                          title="Mark as read"
                        >
                          <CheckCircle className="h-4 w-4" />
                        </Button>
                      )}
                      {!alert.isDismissed && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDismiss(alert.id)}
                          title="Dismiss"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

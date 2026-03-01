"use client";

import { Clock, User, ChefHat, CheckCircle2, Circle, PlayCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface PrepTask {
  id: string;
  name: string;
  status: "PENDING" | "IN_PROGRESS" | "COMPLETED";
  scheduledFor: string;
  estimatedMin: number | null;
  completedAt: string | null;
  notes: string | null;
  recipe: { id: string; name: string } | null;
  assignedTo: { id: string; name: string } | null;
}

const STATUS_CONFIG = {
  PENDING: {
    label: "Pending",
    color: "bg-gray-100 text-gray-700 border-gray-200",
    icon: Circle,
  },
  IN_PROGRESS: {
    label: "In Progress",
    color: "bg-blue-100 text-blue-700 border-blue-200",
    icon: PlayCircle,
  },
  COMPLETED: {
    label: "Completed",
    color: "bg-green-100 text-green-700 border-green-200",
    icon: CheckCircle2,
  },
};

export function PrepTaskCard({
  task,
  onStatusChange,
}: {
  task: PrepTask;
  onStatusChange?: () => void;
}) {
  const config = STATUS_CONFIG[task.status];
  const StatusIcon = config.icon;

  const nextStatus = (): "IN_PROGRESS" | "COMPLETED" | null => {
    if (task.status === "PENDING") return "IN_PROGRESS";
    if (task.status === "IN_PROGRESS") return "COMPLETED";
    return null;
  };

  const handleAdvanceStatus = async () => {
    const next = nextStatus();
    if (!next) return;

    try {
      const res = await fetch(`/api/prep-tasks/${task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });

      if (!res.ok) throw new Error("Failed to update status");

      toast.success(
        next === "IN_PROGRESS" ? "Task started" : "Task completed!"
      );
      onStatusChange?.();
    } catch {
      toast.error("Failed to update task status");
    }
  };

  const next = nextStatus();

  return (
    <Card
      className={`transition-all ${
        task.status === "COMPLETED" ? "opacity-60" : ""
      }`}
    >
      <CardContent className="flex items-center gap-4 py-4">
        {/* Status toggle button */}
        <button
          onClick={handleAdvanceStatus}
          disabled={!next}
          className="shrink-0"
          title={next ? `Mark as ${next === "IN_PROGRESS" ? "In Progress" : "Completed"}` : "Already completed"}
        >
          <StatusIcon
            className={`h-6 w-6 ${
              task.status === "COMPLETED"
                ? "text-green-500"
                : task.status === "IN_PROGRESS"
                ? "text-blue-500"
                : "text-gray-400 hover:text-blue-400"
            } transition-colors`}
          />
        </button>

        {/* Task info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span
              className={`font-medium text-sm ${
                task.status === "COMPLETED" ? "line-through" : ""
              }`}
            >
              {task.name}
            </span>
            <Badge variant="outline" className={config.color}>
              {config.label}
            </Badge>
          </div>

          <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
            {task.recipe && (
              <span className="flex items-center gap-1">
                <ChefHat className="h-3 w-3" />
                {task.recipe.name}
              </span>
            )}
            {task.assignedTo && (
              <span className="flex items-center gap-1">
                <User className="h-3 w-3" />
                {task.assignedTo.name}
              </span>
            )}
            {task.estimatedMin && (
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {task.estimatedMin} min
              </span>
            )}
          </div>

          {task.notes && (
            <p className="text-xs text-muted-foreground mt-1 truncate">
              {task.notes}
            </p>
          )}
        </div>

        {/* Quick action */}
        {next && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleAdvanceStatus}
          >
            {next === "IN_PROGRESS" ? "Start" : "Done"}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

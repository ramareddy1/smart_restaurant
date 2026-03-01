"use client";

import { useState } from "react";
import {
  Calendar,
  Plus,
  Loader2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PrepTaskCard } from "@/components/prep/prep-task-card";
import { usePrepTasks } from "@/hooks/use-prep-tasks";
import { useRecipes } from "@/hooks/use-recipes";

function formatDate(date: Date): string {
  return date.toISOString().split("T")[0];
}

function formatDisplayDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

export default function PrepPage() {
  const [selectedDate, setSelectedDate] = useState(formatDate(new Date()));
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formSubmitting, setFormSubmitting] = useState(false);

  const { tasks, isLoading, mutate } = usePrepTasks({
    date: selectedDate,
    status: statusFilter !== "ALL" ? statusFilter : undefined,
  });
  const { recipes } = useRecipes();

  // Form state
  const [taskName, setTaskName] = useState("");
  const [taskRecipeId, setTaskRecipeId] = useState("");
  const [taskEstimatedMin, setTaskEstimatedMin] = useState("");
  const [taskNotes, setTaskNotes] = useState("");

  const navigateDay = (delta: number) => {
    const d = new Date(selectedDate + "T00:00:00");
    d.setDate(d.getDate() + delta);
    setSelectedDate(formatDate(d));
  };

  const handleCreate = async () => {
    if (!taskName.trim()) {
      toast.error("Task name is required");
      return;
    }

    setFormSubmitting(true);
    try {
      const res = await fetch("/api/prep-tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: taskName,
          recipeId: taskRecipeId || null,
          scheduledFor: new Date(selectedDate + "T08:00:00").toISOString(),
          estimatedMin: taskEstimatedMin
            ? parseInt(taskEstimatedMin)
            : null,
          notes: taskNotes || null,
        }),
      });

      if (!res.ok) throw new Error("Failed to create task");

      toast.success("Prep task created");
      setDialogOpen(false);
      setTaskName("");
      setTaskRecipeId("");
      setTaskEstimatedMin("");
      setTaskNotes("");
      mutate();
    } catch {
      toast.error("Failed to create prep task");
    } finally {
      setFormSubmitting(false);
    }
  };

  // Summary counts
  interface TaskItem {
    id: string;
    status: string;
    estimatedMin: number | null;
  }
  const pending = (tasks as TaskItem[]).filter(
    (t) => t.status === "PENDING"
  ).length;
  const inProgress = (tasks as TaskItem[]).filter(
    (t) => t.status === "IN_PROGRESS"
  ).length;
  const completed = (tasks as TaskItem[]).filter(
    (t) => t.status === "COMPLETED"
  ).length;
  const totalEstMin = (tasks as TaskItem[]).reduce(
    (s, t) => s + (t.estimatedMin ?? 0),
    0
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Calendar className="h-6 w-6" />
            Prep Planning
          </h1>
          <p className="text-muted-foreground">
            Daily prep task scheduling and tracking.
          </p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Task
        </Button>
      </div>

      {/* Date navigation */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => navigateDay(-1)}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="text-center">
          <div className="font-semibold">
            {formatDisplayDate(selectedDate)}
          </div>
          <div className="text-xs text-muted-foreground">
            {pending} pending · {inProgress} in progress · {completed} completed
            {totalEstMin > 0 && ` · ~${totalEstMin} min total`}
          </div>
        </div>
        <Button variant="outline" size="icon" onClick={() => navigateDay(1)}>
          <ChevronRight className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setSelectedDate(formatDate(new Date()))}
        >
          Today
        </Button>
      </div>

      {/* Status filter */}
      <Tabs value={statusFilter} onValueChange={setStatusFilter}>
        <TabsList>
          <TabsTrigger value="ALL">All</TabsTrigger>
          <TabsTrigger value="PENDING">Pending</TabsTrigger>
          <TabsTrigger value="IN_PROGRESS">In Progress</TabsTrigger>
          <TabsTrigger value="COMPLETED">Completed</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Task list */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (tasks as TaskItem[]).length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            No prep tasks for this day.
          </p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => setDialogOpen(true)}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add First Task
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {(
            tasks as Array<{
              id: string;
              name: string;
              status: "PENDING" | "IN_PROGRESS" | "COMPLETED";
              scheduledFor: string;
              estimatedMin: number | null;
              completedAt: string | null;
              notes: string | null;
              recipe: { id: string; name: string } | null;
              assignedTo: { id: string; name: string } | null;
            }>
          ).map((task) => (
            <PrepTaskCard
              key={task.id}
              task={task}
              onStatusChange={() => mutate()}
            />
          ))}
        </div>
      )}

      {/* Add Task Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Prep Task</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Task Name *</Label>
              <Input
                placeholder="e.g., Prep pizza dough (20 portions)"
                value={taskName}
                onChange={(e) => setTaskName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Recipe (optional)</Label>
              <Select
                value={taskRecipeId}
                onValueChange={setTaskRecipeId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Link to recipe" />
                </SelectTrigger>
                <SelectContent>
                  {recipes.map(
                    (r: { id: string; name: string }) => (
                      <SelectItem key={r.id} value={r.id}>
                        {r.name}
                      </SelectItem>
                    )
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Estimated Time (min)</Label>
              <Input
                type="number"
                min="1"
                placeholder="e.g., 30"
                value={taskEstimatedMin}
                onChange={(e) => setTaskEstimatedMin(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                placeholder="Additional notes..."
                value={taskNotes}
                onChange={(e) => setTaskNotes(e.target.value)}
                rows={2}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              disabled={formSubmitting}
            >
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={formSubmitting}>
              {formSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Task"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

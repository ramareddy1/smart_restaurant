import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { listPrepTasks, createPrepTask } from "@/services/prep-task.service";
import { createPrepTaskSchema } from "@/lib/validators";
import { ZodError } from "zod";

export async function GET(request: NextRequest) {
  try {
    await requireUser("OWNER", "HEAD_CHEF");
    const { searchParams } = new URL(request.url);
    const tasks = await listPrepTasks({
      date: searchParams.get("date") ?? undefined,
      status: searchParams.get("status") ?? undefined,
      assignedToId: searchParams.get("assignedToId") ?? undefined,
    });
    return NextResponse.json(tasks);
  } catch (error: unknown) {
    if (error && typeof error === "object" && "status" in error) {
      const e = error as { status: number; message: string };
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    console.error("Failed to fetch prep tasks:", error);
    return NextResponse.json(
      { error: "Failed to fetch prep tasks" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireUser("OWNER", "HEAD_CHEF");
    const body = await request.json();
    const validated = createPrepTaskSchema.parse(body);
    const task = await createPrepTask(validated);
    return NextResponse.json(task, { status: 201 });
  } catch (error: unknown) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.issues },
        { status: 400 }
      );
    }
    if (error && typeof error === "object" && "status" in error) {
      const e = error as { status: number; message: string };
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    console.error("Failed to create prep task:", error);
    return NextResponse.json(
      { error: "Failed to create prep task" },
      { status: 500 }
    );
  }
}

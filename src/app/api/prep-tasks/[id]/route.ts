import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import {
  getPrepTask,
  updatePrepTask,
  deletePrepTask,
} from "@/services/prep-task.service";
import { updatePrepTaskSchema } from "@/lib/validators";
import { ZodError } from "zod";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireUser("OWNER", "HEAD_CHEF");
    const { id } = await params;
    const task = await getPrepTask(id);
    if (!task) {
      return NextResponse.json(
        { error: "Prep task not found" },
        { status: 404 }
      );
    }
    return NextResponse.json(task);
  } catch (error: unknown) {
    if (error && typeof error === "object" && "status" in error) {
      const e = error as { status: number; message: string };
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    console.error("Failed to fetch prep task:", error);
    return NextResponse.json(
      { error: "Failed to fetch prep task" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireUser("OWNER", "HEAD_CHEF");
    const { id } = await params;
    const body = await request.json();
    const validated = updatePrepTaskSchema.parse(body);
    const task = await updatePrepTask(id, validated);
    return NextResponse.json(task);
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
    console.error("Failed to update prep task:", error);
    return NextResponse.json(
      { error: "Failed to update prep task" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireUser("OWNER", "HEAD_CHEF");
    const { id } = await params;
    await deletePrepTask(id);
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    if (error && typeof error === "object" && "status" in error) {
      const e = error as { status: number; message: string };
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    console.error("Failed to delete prep task:", error);
    return NextResponse.json(
      { error: "Failed to delete prep task" },
      { status: 500 }
    );
  }
}

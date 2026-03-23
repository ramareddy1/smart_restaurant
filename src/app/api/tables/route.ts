import { NextRequest, NextResponse } from "next/server";
import { listTables, createTable } from "@/services/table.service";
import { requireUser, AuthError } from "@/lib/auth";
import { createTableSchema } from "@/lib/validators";
import { ZodError } from "zod";

export async function GET() {
  try {
    const user = await requireUser();
    const tables = await listTables(user.restaurantId);
    return NextResponse.json(tables);
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("Failed to fetch tables:", error);
    return NextResponse.json({ error: "Failed to fetch tables" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireUser("OWNER", "KITCHEN_MANAGER");
    const body = await request.json();
    const validated = createTableSchema.parse(body);
    const table = await createTable({
      ...validated,
      restaurantId: user.restaurantId,
    });
    return NextResponse.json(table, { status: 201 });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    if (error instanceof ZodError) {
      return NextResponse.json({ error: "Validation failed", details: error.issues }, { status: 400 });
    }
    console.error("Failed to create table:", error);
    return NextResponse.json({ error: "Failed to create table" }, { status: 500 });
  }
}

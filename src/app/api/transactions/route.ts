import { NextRequest, NextResponse } from "next/server";
import { listTransactions, createTransaction } from "@/services/transaction.service";
import { createTransactionSchema } from "@/lib/validators";
import { ZodError } from "zod";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const result = await listTransactions({
      type: searchParams.get("type") ?? undefined,
      ingredientId: searchParams.get("ingredientId") ?? undefined,
      startDate: searchParams.get("startDate") ?? undefined,
      endDate: searchParams.get("endDate") ?? undefined,
      page: Number(searchParams.get("page") ?? 1),
      pageSize: Number(searchParams.get("pageSize") ?? 50),
    });
    return NextResponse.json(result);
  } catch (error) {
    console.error("Failed to fetch transactions:", error);
    return NextResponse.json({ error: "Failed to fetch transactions" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = createTransactionSchema.parse(body);
    const transaction = await createTransaction({
      type: validated.type,
      ingredientId: validated.ingredientId,
      quantity: validated.quantity,
      unitCost: validated.unitCost ?? null,
      supplierId: validated.supplierId ?? null,
      notes: validated.notes ?? null,
    });
    return NextResponse.json(transaction, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: "Validation failed", details: error.issues }, { status: 400 });
    }
    console.error("Failed to create transaction:", error);
    return NextResponse.json({ error: "Failed to create transaction" }, { status: 500 });
  }
}

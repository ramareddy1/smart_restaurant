import { NextRequest, NextResponse } from "next/server";
import { addPayment, listPayments } from "@/services/payment.service";
import { requireUser, AuthError } from "@/lib/auth";
import { createPaymentSchema } from "@/lib/validators";
import { ZodError } from "zod";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: Params) {
  try {
    await requireUser();
    const { id } = await params;
    const payments = await listPayments(id);
    return NextResponse.json(payments);
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("Failed to fetch payments:", error);
    return NextResponse.json({ error: "Failed to fetch payments" }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: Params) {
  try {
    await requireUser("OWNER", "SERVER");
    const { id } = await params;
    const body = await request.json();
    const validated = createPaymentSchema.parse(body);
    const payment = await addPayment({
      orderId: id,
      ...validated,
    });
    return NextResponse.json(payment, { status: 201 });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    if (error instanceof ZodError) {
      return NextResponse.json({ error: "Validation failed", details: error.issues }, { status: 400 });
    }
    console.error("Failed to add payment:", error);
    return NextResponse.json({ error: "Failed to add payment" }, { status: 500 });
  }
}

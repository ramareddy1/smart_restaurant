import { NextRequest, NextResponse } from "next/server";
import { listSuppliers, createSupplier } from "@/services/supplier.service";
import { createSupplierSchema } from "@/lib/validators";
import { ZodError } from "zod";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const result = await listSuppliers({
      search: searchParams.get("search") ?? undefined,
      page: Number(searchParams.get("page") ?? 1),
      pageSize: Number(searchParams.get("pageSize") ?? 50),
    });
    return NextResponse.json(result);
  } catch (error) {
    console.error("Failed to fetch suppliers:", error);
    return NextResponse.json({ error: "Failed to fetch suppliers" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = createSupplierSchema.parse(body);
    const supplier = await createSupplier({
      name: validated.name,
      contactEmail: validated.contactEmail || null,
      contactPhone: validated.contactPhone || null,
      address: validated.address || null,
      notes: validated.notes || null,
    });
    return NextResponse.json(supplier, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: "Validation failed", details: error.issues }, { status: 400 });
    }
    console.error("Failed to create supplier:", error);
    return NextResponse.json({ error: "Failed to create supplier" }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { getSupplier, updateSupplier, deleteSupplier } from "@/services/supplier.service";
import { updateSupplierSchema } from "@/lib/validators";
import { ZodError } from "zod";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const supplier = await getSupplier(id);
    if (!supplier) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(supplier);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch supplier" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const validated = updateSupplierSchema.parse(body);
    const supplier = await updateSupplier(id, {
      ...validated,
      contactEmail: validated.contactEmail || null,
      contactPhone: validated.contactPhone || null,
      address: validated.address || null,
      notes: validated.notes || null,
    });
    return NextResponse.json(supplier);
  } catch (error) {
    if (error instanceof ZodError) return NextResponse.json({ error: "Validation failed" }, { status: 400 });
    return NextResponse.json({ error: "Failed to update supplier" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await deleteSupplier(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete supplier" }, { status: 500 });
  }
}

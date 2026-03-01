import { NextRequest, NextResponse } from "next/server";
import { listStaff, createStaffMember } from "@/services/staff.service";
import { requireUser } from "@/lib/auth";
import { createUserSchema } from "@/lib/validators";
import { ZodError } from "zod";
import type { UserRole } from "@generated/prisma";

export async function GET(request: NextRequest) {
  try {
    const user = await requireUser("OWNER");
    const { searchParams } = new URL(request.url);

    const result = await listStaff({
      restaurantId: user.restaurantId,
      search: searchParams.get("search") ?? undefined,
      role: (searchParams.get("role") as UserRole) ?? undefined,
      activeOnly: searchParams.get("showInactive") !== "true",
    });

    return NextResponse.json(result);
  } catch (error: unknown) {
    if (error && typeof error === "object" && "status" in error) {
      const authError = error as { status: number; message: string };
      return NextResponse.json(
        { error: authError.message },
        { status: authError.status }
      );
    }
    console.error("Failed to fetch staff:", error);
    return NextResponse.json(
      { error: "Failed to fetch staff" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireUser("OWNER");
    const body = await request.json();
    const validated = createUserSchema.parse(body);

    const staffMember = await createStaffMember({
      email: validated.email,
      name: validated.name,
      role: validated.role,
      pin: validated.pin,
      restaurantId: user.restaurantId,
    });

    return NextResponse.json(staffMember, { status: 201 });
  } catch (error: unknown) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.issues },
        { status: 400 }
      );
    }
    if (error && typeof error === "object" && "status" in error) {
      const authError = error as { status: number; message: string };
      return NextResponse.json(
        { error: authError.message },
        { status: authError.status }
      );
    }
    if (error instanceof Error && error.message.includes("already exists")) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    console.error("Failed to create staff member:", error);
    return NextResponse.json(
      { error: "Failed to create staff member" },
      { status: 500 }
    );
  }
}

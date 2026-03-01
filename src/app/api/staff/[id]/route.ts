import { NextRequest, NextResponse } from "next/server";
import {
  getStaffMember,
  updateStaffMember,
  deactivateStaffMember,
} from "@/services/staff.service";
import { requireUser } from "@/lib/auth";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireUser("OWNER");
    const { id } = await params;
    const member = await getStaffMember(id);

    if (!member) {
      return NextResponse.json(
        { error: "Staff member not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(member);
  } catch (error: unknown) {
    if (error && typeof error === "object" && "status" in error) {
      const authError = error as { status: number; message: string };
      return NextResponse.json(
        { error: authError.message },
        { status: authError.status }
      );
    }
    console.error("Failed to fetch staff member:", error);
    return NextResponse.json(
      { error: "Failed to fetch staff member" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await requireUser("OWNER");
    const { id } = await params;
    const body = await request.json();

    // Prevent owner from changing their own role
    if (id === currentUser.id && body.role && body.role !== "OWNER") {
      return NextResponse.json(
        { error: "You cannot change your own role" },
        { status: 400 }
      );
    }

    // Prevent owner from deactivating themselves
    if (id === currentUser.id && body.isActive === false) {
      return NextResponse.json(
        { error: "You cannot deactivate your own account" },
        { status: 400 }
      );
    }

    const updated = await updateStaffMember(id, body);
    return NextResponse.json(updated);
  } catch (error: unknown) {
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
    console.error("Failed to update staff member:", error);
    return NextResponse.json(
      { error: "Failed to update staff member" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await requireUser("OWNER");
    const { id } = await params;

    // Prevent owner from deactivating themselves
    if (id === currentUser.id) {
      return NextResponse.json(
        { error: "You cannot deactivate your own account" },
        { status: 400 }
      );
    }

    await deactivateStaffMember(id);
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    if (error && typeof error === "object" && "status" in error) {
      const authError = error as { status: number; message: string };
      return NextResponse.json(
        { error: authError.message },
        { status: authError.status }
      );
    }
    console.error("Failed to deactivate staff member:", error);
    return NextResponse.json(
      { error: "Failed to deactivate staff member" },
      { status: 500 }
    );
  }
}

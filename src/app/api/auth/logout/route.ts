import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { logout } from "@/services/auth.service";
import { SESSION_COOKIE } from "@/lib/auth";

export async function POST() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE)?.value;

    if (token) {
      await logout(token);
    }

    cookieStore.delete(SESSION_COOKIE);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Logout error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getCurrentUser, SESSION_COOKIE } from "@/lib/auth";
import { loginWithPin, logout } from "@/services/auth.service";
import { z } from "zod";

const pinSwitchSchema = z.object({
  pin: z.string().regex(/^\d{4}$/, "PIN must be exactly 4 digits"),
});

export async function POST(request: Request) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = pinSwitchSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid PIN format" },
        { status: 400 }
      );
    }

    // Log out current session
    const cookieStore = await cookies();
    const oldToken = cookieStore.get(SESSION_COOKIE)?.value;
    if (oldToken) {
      await logout(oldToken);
    }

    // Log in with PIN (same restaurant)
    const result = await loginWithPin(
      parsed.data.pin,
      currentUser.restaurantId
    );
    if (!result) {
      return NextResponse.json({ error: "Invalid PIN" }, { status: 401 });
    }

    cookieStore.set(SESSION_COOKIE, result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      expires: result.expiresAt,
    });

    return NextResponse.json({
      user: {
        id: result.user.id,
        email: result.user.email,
        name: result.user.name,
        role: result.user.role,
        restaurantId: result.user.restaurantId,
      },
    });
  } catch (error) {
    console.error("PIN switch error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

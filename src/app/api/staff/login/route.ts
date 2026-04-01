import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { password } = body;

    const staffPassword = process.env.STAFF_PASSWORD;

    if (staffPassword && password === staffPassword) {
      const session = await getSession();
      session.staffLoggedIn = true;
      await session.save();

      return NextResponse.json({ success: true });
    }

    return NextResponse.json(
      { error: "Invalid password. Please try again." },
      { status: 401 }
    );
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
